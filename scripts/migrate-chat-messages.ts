/**
 * Script ONE-SHOT — Migrazione chat da array di stringhe a subcollection
 *
 * ESEGUI UNA VOLTA SOLA prima di fare deploy del nuovo codice chat.
 *
 * Funzionamento:
 *  1. Legge ogni documento /chats/{id}
 *  2. Per ogni stringa nell'array messages[], crea un documento in /chats/{id}/messages/{auto}
 *  3. Rimuove il campo messages[] dal documento parent
 *  4. Aggiorna lastMessage e lastMessageTime sul documento parent
 *
 * USO:
 *   npx ts-node --project tsconfig.json scripts/migrate-chat-messages.ts
 *
 * PREREQUISITI:
 *   - SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json (scaricabile da Firebase Console → Impostazioni progetto → Account di servizio)
 *   - npm install firebase-admin (solo per questo script)
 */

import * as admin from "firebase-admin";
import * as fs from "fs";

const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH || "./serviceAccountKey.json";

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ Service account non trovato in: ${SERVICE_ACCOUNT_PATH}`);
  console.error("   Scaricalo da: Firebase Console → Impostazioni progetto → Account di servizio → Genera nuova chiave privata");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateChats() {
  console.log("🚀 Avvio migrazione chat...\n");

  const chatsSnapshot = await db.collection("chats").get();
  console.log(`📋 Chat trovate: ${chatsSnapshot.size}`);

  let migratedChats = 0;
  let skippedChats = 0;
  let totalMessages = 0;

  for (const chatDoc of chatsSnapshot.docs) {
    const chatData = chatDoc.data();
    const messages: string[] = chatData.messages || [];

    if (messages.length === 0) {
      console.log(`  ⏭  Chat ${chatDoc.id}: nessun messaggio nell'array, skip`);
      skippedChats++;
      continue;
    }

    // Controlla se la subcollection esiste già (migrazione già eseguita)
    const existingMessages = await chatDoc.ref.collection("messages").limit(1).get();
    if (!existingMessages.empty) {
      console.log(`  ⏭  Chat ${chatDoc.id}: subcollection messages già presente, skip`);
      skippedChats++;
      continue;
    }

    console.log(`  🔄 Chat ${chatDoc.id}: migro ${messages.length} messaggi...`);

    const batch = db.batch();
    let lastMessageText = "";
    let lastMessageTime = chatData.createdAt || admin.firestore.Timestamp.now();

    for (const msgString of messages) {
      const colonIndex = msgString.indexOf(": ");
      let senderEmail: string;
      let text: string;

      if (colonIndex !== -1) {
        senderEmail = msgString.substring(0, colonIndex);
        text = msgString.substring(colonIndex + 2);
      } else {
        // Messaggio senza prefisso email (es. messaggio di sistema)
        senderEmail = "sistema";
        text = msgString;
      }

      const isSystem = senderEmail === "sistema" || senderEmail === "Sistema";
      const msgRef = chatDoc.ref.collection("messages").doc();

      batch.set(msgRef, {
        senderId: isSystem ? "sistema" : "migrated_unknown",
        senderEmail: senderEmail,
        senderRole: isSystem ? "sistema" : "migrated",
        text: text,
        createdAt: chatData.createdAt || admin.firestore.Timestamp.now(),
      });

      lastMessageText = text;
      lastMessageTime = chatData.updatedAt || chatData.createdAt || admin.firestore.Timestamp.now();
      totalMessages++;
    }

    // Aggiorna il documento parent: rimuovi messages[], aggiorna lastMessage
    batch.update(chatDoc.ref, {
      messages: admin.firestore.FieldValue.delete(),
      lastMessage: lastMessageText,
      lastMessageTime: lastMessageTime,
      lastSenderId: "migrated",
    });

    await batch.commit();
    console.log(`  ✅ Chat ${chatDoc.id}: ${messages.length} messaggi migrati`);
    migratedChats++;
  }

  console.log("\n📊 Riepilogo migrazione:");
  console.log(`   Chat migrate:  ${migratedChats}`);
  console.log(`   Chat skippate: ${skippedChats}`);
  console.log(`   Messaggi totali creati: ${totalMessages}`);
  console.log("\n✅ Migrazione completata!");
}

migrateChats().catch((err) => {
  console.error("❌ Errore durante la migrazione:", err);
  process.exit(1);
});
