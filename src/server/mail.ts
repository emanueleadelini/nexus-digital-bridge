/**
 * Email transazionali via postfix locale (container/host), no provider esterni.
 * Env: SMTP_HOST (default 127.0.0.1), SMTP_PORT (25), MAIL_FROM, APP_URL.
 */
import nodemailer from "nodemailer";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://nexusdigitalbridge.it";
const MAIL_FROM = `"${(process.env.MAIL_FROM_NAME || "Nexus Digital Bridge").replace(/"/g, "")}" <${
  process.env.MAIL_FROM || "noreply@nexusdigitalbridge.it"
}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "127.0.0.1",
  port: Number(process.env.SMTP_PORT || 25),
  secure: false,
  tls: { rejectUnauthorized: false },
});

async function send(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: MAIL_FROM, to, subject, html });
    return { success: true };
  } catch (err) {
    console.error("[mailer] invio fallito:", (err as Error).message);
    return { success: false, error: (err as Error).message };
  }
}

function shell(inner: string) {
  return `<div style="font-family: sans-serif; padding: 20px; color: #1a237e; border: 1px solid #eee; border-radius: 12px;">${inner}</div>`;
}

export async function notifyAdminOfNewUser({
  email,
  role,
  name,
}: {
  email: string;
  role: string;
  name: string;
}) {
  if (!ADMIN_EMAIL) return { success: false, error: "ADMIN_EMAIL non configurata" };
  return send(
    ADMIN_EMAIL,
    `Nuova Registrazione in Attesa: ${role}`,
    shell(`<h1 style="color:#1a237e">Nuovo Utente su Nexus Digital Bridge</h1>
<p>Un nuovo utente attende l'approvazione per accedere alla piattaforma.</p>
<ul style="list-style:none;padding:0">
<li><strong>Nome/Ragione Sociale:</strong> ${name}</li>
<li><strong>Email:</strong> ${email}</li>
<li><strong>Ruolo Richiesto:</strong> ${role}</li></ul>
<div style="margin-top:30px"><a href="${APP_URL}/admin/users" style="background-color:#ff9800;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Vai alla Dashboard Admin per Approvare</a></div>`)
  );
}

export async function sendWelcomePendingEmail(userEmail: string, userName: string) {
  return send(
    userEmail,
    "Registrazione ricevuta - Nexus Digital Bridge",
    shell(`<h1 style="color:#1a237e">Benvenuto su Nexus Digital Bridge, ${userName}!</h1>
<p>La tua richiesta e' in fase di verifica da parte del nostro team.</p>
<p>Riceverai un'email non appena il profilo sara' approvato e potrai usare il sistema di matching.</p>
<p>A presto,<br>Il team di Nexus Digital Bridge</p>`)
  );
}

export async function sendApprovalEmail(userEmail: string, userName: string) {
  return send(
    userEmail,
    "Account Approvato - Benvenuto su Nexus Digital Bridge",
    shell(`<h1 style="color:#1a237e">Ottime notizie, ${userName}!</h1>
<p>Il tuo account su Nexus Digital Bridge e' stato approvato.</p>
<p>Ora puoi accedere al matching intelligente, alla ricerca istituti e alla chat diretta.</p>
<div style="margin-top:30px"><a href="${APP_URL}/login" style="background-color:#1a237e;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Accedi alla tua Dashboard</a></div>
<p style="margin-top:30px">Buon lavoro!<br>Il team di Nexus Digital Bridge</p>`)
  );
}

export async function sendRejectionEmail(userEmail: string, userName: string) {
  return send(
    userEmail,
    "Aggiornamento sulla tua registrazione - Nexus Digital Bridge",
    shell(`<h1 style="color:#1a237e">Ciao ${userName},</h1>
<p>Dopo aver esaminato i dati forniti, non siamo in grado di approvare il tuo account in questo momento.</p>
<p>Se ritieni ci sia stato un errore, rispondi a questa email.</p>
<p>Cordiali saluti,<br>Il team di Nexus Digital Bridge</p>`)
  );
}

export async function sendNewMatchEmail(
  toEmail: string,
  toName: string,
  studentName: string,
  score: number
) {
  return send(
    toEmail,
    `Nuovo match ${score}%: ${studentName} - Nexus Digital Bridge`,
    shell(`<h1 style="color:#1a237e">Nuovo profilo compatibile</h1>
<p>Ciao ${toName}, un nuovo CV compatibile con i tuoi settori e' stato caricato:</p>
<ul style="list-style:none;padding:0"><li><strong>Studente:</strong> ${studentName}</li><li><strong>Affinita':</strong> ${score}%</li></ul>
<div style="margin-top:30px"><a href="${APP_URL}/dashboard/matches" style="background-color:#ff9800;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Vedi il Match</a></div>`)
  );
}

export async function sendNewChatEmail(
  toEmail: string,
  toName: string,
  fromName: string
) {
  return send(
    toEmail,
    `${fromName} ti ha contattato - Nexus Digital Bridge`,
    shell(`<h1 style="color:#1a237e">Nuova conversazione</h1>
<p>Ciao ${toName}, <strong>${fromName}</strong> ha avviato una conversazione con te su Nexus Digital Bridge.</p>
<div style="margin-top:30px"><a href="${APP_URL}/dashboard/chat" style="background-color:#1a237e;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Apri la Chat</a></div>`)
  );
}
