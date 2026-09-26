/**
 * Import firestore-export.json -> Postgres (nexus_bridge).
 * Uso sul server:
 *   DATABASE_URL=... node scripts/import-firestore.js --dry-run
 *   poi senza --dry-run. Oppure dentro il container nexus-test che ha pg bundled.
 * Note:
 * - uid Firebase -> id Postgres (CV/chat puntano agli uid).
 * - Password NON migrabili: riga `account` credential con hash random
 *   inutilizzabile -> gli utenti usano "password dimenticata".
 * - PDF originali mai salvati su Firestore -> pdf_path NULL.
 */
const fs = require("fs");
const { Client } = require("pg");
const crypto = require("crypto");

const DRY = process.argv.includes("--dry-run");
const FILE = process.env.EXPORT_FILE || "firestore-export.json";
const dump = JSON.parse(fs.readFileSync(FILE, "utf8"));

const pg = new Client({ connectionString: process.env.DATABASE_URL });

const ts = (v) => {
  if (!v) return new Date();
  const d = new Date(v);
  return isNaN(d) ? new Date() : d;
};
const arr = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
const s = (v, d = "") => (v == null ? d : String(v));

const stats = {};
const report = (t, n = 1) => { stats[t] = (stats[t] || 0) + n; };

async function q(sql, params) {
  if (DRY) return;
  await pg.query(sql, params);
}

async function run() {
  if (!DRY) await pg.connect();

  // users + account
  for (const u of dump.users || []) {
    const name =
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
      s(u.name) || s(u.email).split("@")[0];
    await q(
      `INSERT INTO "user" (id,name,email,email_verified,created_at,updated_at,role,status,first_name,last_name)
       VALUES ($1,$2,$3,true,$4,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [u.id, name, s(u.email), ts(u.createdAt), s(u.role, "Company"), s(u.status, "Pending"),
       s(u.firstName, null), s(u.lastName, null)]
    );
    await q(
      `INSERT INTO "account" (id,account_id,provider_id,user_id,password,created_at,updated_at)
       VALUES ($1,$2,'credential',$3,$4,$5,$5) ON CONFLICT (id) DO NOTHING`,
      [crypto.randomUUID(), u.id, u.id, "$2b$10$" + crypto.randomBytes(40).toString("hex"), ts(u.createdAt)]
    );
    report("user");
  }

  // stub user per entità demo senza account Firebase (companies/institutes
  // referenziano user.id via FK)
  const userIds = new Set((dump.users || []).map((u) => u.id));
  for (const c of dump.companies || []) {
    if (!userIds.has(c.id)) {
      await q(
        `INSERT INTO "user" (id,name,email,email_verified,role,status)
         VALUES ($1,$2,$3,false,'Company','Approved') ON CONFLICT (id) DO NOTHING`,
        [c.id, s(c.name), s(c.email) || `${c.id}@demo.nexus`]
      );
      userIds.add(c.id);
      report("user_stub");
    }
  }
  for (const i of dump.institutes || []) {
    if (!userIds.has(i.id)) {
      await q(
        `INSERT INTO "user" (id,name,email,email_verified,role,status)
         VALUES ($1,$2,$3,false,'Institute','Approved') ON CONFLICT (id) DO NOTHING`,
        [i.id, s(i.name), s(i.email) || `${i.id}@demo.nexus`]
      );
      userIds.add(i.id);
      report("user_stub");
    }
  }

  for (const c of dump.companies || []) {
    await q(
      `INSERT INTO companies (id,name,email,vat_number,address,website,description,sector_ids,is_demo,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [c.id, s(c.name), s(c.email), s(c.vatNumber, null), s(c.address, null),
       s(c.website, null), s(c.description, null), arr(c.sectorIds), !!c.isDemo, ts(c.createdAt)]
    );
    report("companies");
  }

  for (const i of dump.institutes || []) {
    await q(
      `INSERT INTO institutes (id,name,email,address,types,sector_ids,is_demo,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [i.id, s(i.name), s(i.email), s(i.address, null), arr(i.types), arr(i.sectorIds), !!i.isDemo, ts(i.createdAt)]
    );
    report("institutes");
  }

  for (const cv of dump.studentCVs || []) {
    await q(
      `INSERT INTO student_cvs (id,institute_id,name,student_class,cv_information,sector_ids,skills,pdf_path,is_demo,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'{}',NULL,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [cv.id, cv._instituteId, s(cv.name, "Studente"), s(cv.class || cv.studentClass),
       s(cv.cvInformation), arr(cv.sectorIds), !!cv.isDemo, ts(cv.createdAt)]
    );
    report("student_cvs");
  }

  const userByEmail = {};
  for (const u of dump.users || []) userByEmail[s(u.email).toLowerCase()] = u;

  for (const c of dump.chats || []) {
    if (!c.companyId || !c.instituteId) { report("chats_skipped"); continue; }
    const lastMsg = s(c.lastMessage, null) ||
      (Array.isArray(c.messages) && c.messages.length
        ? s(c.messages[c.messages.length - 1]).slice(0, 200)
        : null);
    await q(
      `INSERT INTO chats (id,company_id,institute_id,student_cv_id,creator_id,last_message,last_message_at,last_sender_id,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [c.id, c.companyId, c.instituteId, c.studentCVId || null, c.companyId,
       lastMsg, c.lastMessageTime ? ts(c.lastMessageTime) : (c.updatedAt ? ts(c.updatedAt) : null),
       s(c.lastSenderId, null), ts(c.createdAt)]
    );
    report("chats");

    // formato vecchio: messages = array inline di stringhe "senderEmail: testo"
    if (Array.isArray(c.messages)) {
      for (const raw of c.messages) {
        const str = s(raw);
        const sep = str.indexOf(":");
        const who = sep > 0 ? str.slice(0, sep).trim() : "sistema";
        const text = sep > 0 ? str.slice(sep + 1).trim() : str;
        const sender = userByEmail[who.toLowerCase()];
        await q(
          `INSERT INTO messages (id,chat_id,sender_id,sender_email,sender_role,text,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
          [crypto.randomUUID(), c.id, sender ? sender.id : (who === "sistema" || who === "Sistema" ? "system" : who),
           sender ? s(sender.email) : (who.includes("@") ? who : ""), sender ? s(sender.role) : "sistema",
           text, ts(c.updatedAt || c.createdAt)]
        );
        report("messages_inline");
      }
    }
  }

  for (const m of dump.messages || []) {
    await q(
      `INSERT INTO messages (id,chat_id,sender_id,sender_email,sender_role,text,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [m.id, m._chatId, s(m.senderId), s(m.senderEmail), s(m.senderRole), s(m.text), ts(m.createdAt)]
    );
    report("messages");
  }

  for (const sec of dump.sectors || []) {
    await q(`INSERT INTO sectors (id,name,created_at) VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING`,
      [sec.id, s(sec.name), ts(sec.createdAt)]);
    report("sectors");
  }
  for (const t of dump.instituteTypes || []) {
    await q(`INSERT INTO institute_types (id,name,created_at) VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING`,
      [t.id, s(t.name), ts(t.createdAt)]);
    report("institute_types");
  }
  for (const b of dump.blogPosts || []) {
    await q(
      `INSERT INTO blog_posts (id,title,excerpt,content,tags,author,cover_image,is_demo,published_at,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [b.id, s(b.title), s(b.excerpt), s(b.content), arr(b.tags),
       s(b.author, "Nexus Digital Bridge"), s(b.coverImage, null), !!b.isDemo,
       ts(b.publishedAt), ts(b.createdAt)]
    );
    report("blog_posts");
  }
  for (const cf of dump.config || []) {
    const { id, ...rest } = cf;
    await q(`INSERT INTO config (id,value) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET value=$2`,
      [id, JSON.stringify(rest)]);
    report("config");
  }
  for (const n of dump.notifications || []) {
    await q(
      `INSERT INTO notifications (id,user_id,type,title,body,link,read_at,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [n.id, s(n.userId), s(n.type), s(n.title), s(n.body), s(n.link, null),
       n.readAt ? ts(n.readAt) : null, ts(n.createdAt)]
    );
    report("notifications");
  }

  console.log(DRY ? "=== DRY RUN ===" : "=== IMPORT DONE ===");
  console.table(stats);
  if (!DRY) await pg.end();
  process.exit(0);
}

run().catch((e) => { console.error("IMPORT FAILED:", e); process.exit(1); });
