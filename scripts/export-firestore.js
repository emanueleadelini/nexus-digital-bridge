/**
 * Export Firestore -> JSON usando la sessione firebase-tools del PC.
 * Il refresh token ha scope cloud-platform => accesso IAM Owner, bypass rules.
 * Uso: node scripts/export-firestore.js  ->  firestore-export.json
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const PROJECT = "studio-2511976075-f03a5";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function getAccessToken() {
  const cfg = JSON.parse(
    fs.readFileSync(path.join(os.homedir(), ".config/configstore/firebase-tools.json"), "utf8")
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: cfg.tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error("refresh failed: " + JSON.stringify(d));
  return d.access_token;
}

// Firestore typed value -> plain JS
function fromFS(v) {
  if (v == null) return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(fromFS);
  if (v.mapValue !== undefined) {
    const o = {};
    for (const [k, vv] of Object.entries(v.mapValue.fields || {})) o[k] = fromFS(vv);
    return o;
  }
  if (v.referenceValue !== undefined) return v.referenceValue;
  return null;
}

async function listDocs(token, colPath) {
  const out = [];
  let pageToken = "";
  do {
    const url = `${BASE}/${colPath}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (!res.ok) throw new Error(`${colPath}: ${res.status} ${JSON.stringify(d).slice(0, 200)}`);
    for (const doc of d.documents || []) {
      const id = doc.name.split("/").pop();
      const fields = {};
      for (const [k, v] of Object.entries(doc.fields || {})) fields[k] = fromFS(v);
      out.push({ id, ...fields });
    }
    pageToken = d.nextPageToken || "";
  } while (pageToken);
  return out;
}

async function main() {
  const token = await getAccessToken();
  console.error("token ok");
  const dump = {};

  // collezioni top-level
  for (const col of ["users", "companies", "institutes", "chats", "sectors", "instituteTypes", "blogPosts", "config", "notifications"]) {
    try {
      dump[col] = await listDocs(token, col);
      console.error(`${col}: ${dump[col].length}`);
    } catch (e) {
      console.error(`${col}: SKIP ${e.message}`);
      dump[col] = [];
    }
  }

  // subcollection studentCVs sotto institutes
  dump.studentCVs = [];
  for (const inst of dump.institutes) {
    try {
      const cvs = await listDocs(token, `institutes/${inst.id}/studentCVs`);
      for (const cv of cvs) cv._instituteId = inst.id;
      dump.studentCVs.push(...cvs);
    } catch (e) { console.error(`institutes/${inst.id}/studentCVs: ${e.message}`); }
  }
  console.error(`studentCVs: ${dump.studentCVs.length}`);

  // subcollection messages sotto chats
  dump.messages = [];
  for (const chat of dump.chats) {
    try {
      const msgs = await listDocs(token, `chats/${chat.id}/messages`);
      for (const m of msgs) m._chatId = chat.id;
      dump.messages.push(...msgs);
    } catch (e) { console.error(`chats/${chat.id}/messages: ${e.message}`); }
  }
  console.error(`messages: ${dump.messages.length}`);

  fs.writeFileSync("firestore-export.json", JSON.stringify(dump, null, 1));
  console.error("scritto firestore-export.json");
}

main().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
