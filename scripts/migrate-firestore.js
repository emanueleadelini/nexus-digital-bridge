/**
 * Migrazione Firestore -> Postgres per Nexus Digital Bridge.
 * Uso (sul server):
 *   mkdir -p /tmp/nexus-migrate && cd /tmp/nexus-migrate
 *   npm init -y && npm i firebase-admin pg
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/serviceAccount.json \
 *   DATABASE_URL=postgresql://nexus:***@172.17.0.1:5432/nexus_bridge \
 *   node /root/projects/nexus-digital-bridge/scripts/migrate-firestore.js --dry-run
 *   poi senza --dry-run per applicare.
 *
 * Note:
 * - Gli uid Firebase diventano gli id utente in Postgres (i CV/chat puntano agli uid).
 * - Le password NON migrano: ogni utente dovra' fare "password dimenticata".
 * - Viene creata una riga `account` credential con hash random inutilizzabile
 *   cosi' il reset password Better Auth funziona.
 * - I PDF originali non erano salvati su Firestore: pdf_path resta NULL.
 */
const admin = require("firebase-admin");
const { Client } = require("pg");
const crypto = require("crypto");

const DRY = process.argv.includes("--dry-run");

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const fs = admin.firestore();
const pg = new Client({ connectionString: process.env.DATABASE_URL });

const ts = (v) => {
  if (!v) return new Date();
  if (v.toDate) return v.toDate();
  if (v._seconds) return new Date(v._seconds * 1000);
  const d = new Date(v);
  return isNaN(d) ? new Date() : d;
};
const arr = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
const s = (v, d = "") => (v == null ? d : String(v));

const stats = {};
const report = (t, n) => { stats[t] = (stats[t] || 0) + n; };

async function migrate() {
  await pg.connect();

  // --- users + account -------------------------------------------------------
  const usersSnap = await fs.collection("users").get();
  for (const doc of usersSnap.docs) {
    const u = doc.data();
    const id = doc.id;
    const name =
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
      s(u.name) || s(u.email).split("@")[0];
    const role = s(u.role, "Company");
    const status = s(u.status, "Pending");
    if (!DRY) {
      await pg.query(
        `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at, role, status, first_name, last_name)
         VALUES ($1,$2,$3,true,$4,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, s(u.email), ts(u.createdAt), role, status, s(u.firstName, null), s(u.lastName, null)]
      );
      await pg.query(
        `INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
         VALUES ($1,$2,'credential',$3,$4,$5,$5)
         ON CONFLICT (id) DO NOTHING`,
        [
          crypto.randomUUID(),
          id,
          id,
          "$2b$10$" + crypto.randomBytes(40).toString("hex"), // hash inutilizzabile
          ts(u.createdAt),
        ]
      );
    }
    report("user", 1);
  }

  // --- companies -------------------------------------------------------------
  const compSnap = await fs.collection("companies").get();
  for (const doc of compSnap.docs) {
    const c = doc.data();
    if (!DRY) {
      await pg.query(
        `INSERT INTO companies (id, name, email, vat_number, address, website, description, sector_ids, is_demo, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO NOTHING`,
        [doc.id, s(c.name), s(c.email), s(c.vatNumber, null), s(c.address, null),
         s(c.website, null), s(c.description, null), arr(c.sectorIds), !!c.isDemo, ts(c.createdAt)]
      );
    }
    report("companies", 1);
  }

  // --- institutes + studentCVs subcollection ----------------------------------
  const instSnap = await fs.collection("institutes").get();
  for (const doc of instSnap.docs) {
    const i = doc.data();
    if (!DRY) {
      await pg.query(
        `INSERT INTO institutes (id, name, email, address, types, sector_ids, is_demo, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [doc.id, s(i.name), s(i.email), s(i.address, null), arr(i.types), arr(i.sectorIds), !!i.isDemo, ts(i.createdAt)]
      );
    }
    report("institutes", 1);

    const cvSnap = await doc.ref.collection("studentCVs").get();
    for (const cvDoc of cvSnap.docs) {
      const cv = cvDoc.data();
      if (!DRY) {
        await pg.query(
          `INSERT INTO student_cvs (id, institute_id, name, student_class, cv_information, sector_ids, skills, pdf_path, is_demo, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,'{}',NULL,$7,$8)
           ON CONFLICT (id) DO NOTHING`,
          [cvDoc.id, doc.id, s(cv.name, "Studente"), s(cv.class || cv.studentClass),
           s(cv.cvInformation), arr(cv.sectorIds), !!cv.isDemo, ts(cv.createdAt)]
        );
      }
      report("student_cvs", 1);
    }
  }

  // --- chats + messages subcollection -----------------------------------------
  const chatSnap = await fs.collection("chats").get();
  for (const doc of chatSnap.docs) {
    const c = doc.data();
    if (!c.companyId || !c.instituteId) { report("chats_skipped", 1); continue; }
    if (!DRY) {
      await pg.query(
        `INSERT INTO chats (id, company_id, institute_id, student_cv_id, creator_id, last_message, last_message_at, last_sender_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [doc.id, c.companyId, c.instituteId, c.studentCVId || null, c.companyId,
         s(c.lastMessage, null), c.lastMessageAt ? ts(c.lastMessageAt) : null,
         s(c.lastSenderId, null), ts(c.createdAt)]
      );
    }
    report("chats", 1);

    const msgSnap = await doc.ref.collection("messages").orderBy("createdAt").get();
    for (const mDoc of msgSnap.docs) {
      const m = mDoc.data();
      if (!DRY) {
        await pg.query(
          `INSERT INTO messages (id, chat_id, sender_id, sender_email, sender_role, text, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (id) DO NOTHING`,
          [mDoc.id, doc.id, s(m.senderId), s(m.senderEmail), s(m.senderRole), s(m.text), ts(m.createdAt)]
        );
      }
      report("messages", 1);
    }
  }

  // --- sectors / instituteTypes / blogPosts / config ---------------------------
  const copySimple = async (coll, table, fields) => {
    const snap = await fs.collection(coll).get();
    for (const doc of snap.docs) {
      const d = doc.data();
      if (!DRY) {
        if (table === "sectors" || table === "institute_types") {
          await pg.query(
            `INSERT INTO ${table} (id, name, created_at) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
            [doc.id, s(d.name), ts(d.createdAt)]
          );
        } else if (table === "blog_posts") {
          await pg.query(
            `INSERT INTO blog_posts (id, title, excerpt, content, tags, author, cover_image, is_demo, published_at, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
            [doc.id, s(d.title), s(d.excerpt), s(d.content), arr(d.tags),
             s(d.author, "Nexus Digital Bridge"), s(d.coverImage, null), !!d.isDemo,
             ts(d.publishedAt), ts(d.createdAt)]
          );
        } else if (table === "config") {
          await pg.query(
            `INSERT INTO config (id, value) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET value=$2`,
            [doc.id, JSON.stringify(d)]
          );
        }
      }
      report(table, 1);
    }
  };
  await copySimple("sectors", "sectors");
  await copySimple("instituteTypes", "institute_types");
  await copySimple("blogPosts", "blog_posts");
  await copySimple("config", "config");

  console.log(DRY ? "=== DRY RUN ===" : "=== MIGRATION DONE ===");
  console.table(stats);
  await pg.end();
  process.exit(0);
}

migrate().catch((e) => {
  console.error("MIGRATION FAILED:", e);
  process.exit(1);
});
