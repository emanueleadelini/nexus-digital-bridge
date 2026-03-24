'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

interface NotifyAdminInput {
  email: string;
  role: string;
  name: string;
}

/**
 * Invia un'email all'amministratore per notificare la registrazione di un nuovo utente.
 */
export async function notifyAdminOfNewUser({ email, role, name }: NotifyAdminInput) {
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) {
    console.warn("RESEND_API_KEY o ADMIN_EMAIL non configurati nelle variabili d'ambiente.");
    return { success: false, error: "Config missing" };
  }

  try {
    await resend.emails.send({
      from: 'Nexus Digital Bridge <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `Nuova Registrazione in Attesa: ${role}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a237e; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #1a237e;">Nuovo Utente su Nexus Digital Bridge</h1>
          <p>Un nuovo utente ha completato la registrazione e attende l'approvazione per accedere alla piattaforma.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Nome/Ragione Sociale:</strong> ${name}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${email}</li>
            <li style="margin-bottom: 10px;"><strong>Ruolo Richiesto:</strong> ${role}</li>
          </ul>
          <div style="margin-top: 30px;">
            <a href="https://nexus-digital-bridge.web.app/admin/users" 
               style="background-color: #ff9800; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Vai alla Dashboard Admin per Approvare
            </a>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Errore notifica admin:", err);
    return { success: false, error: err };
  }
}

/**
 * Invia un'email di cortesia all'utente appena registrato.
 */
export async function sendWelcomePendingEmail(userEmail: string, userName: string) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: 'Nexus Digital Bridge <onboarding@resend.dev>',
      to: [userEmail],
      subject: 'Registrazione ricevuta - Nexus Digital Bridge',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a237e;">
          <h1 style="color: #1a237e;">Benvenuto su Nexus Digital Bridge, ${userName}!</h1>
          <p>Grazie per esserti registrato sulla nostra piattaforma.</p>
          <p>Ti informiamo che la tua richiesta è attualmente in fase di verifica da parte del nostro team amministrativo. Questo processo di solito richiede meno di 24 ore.</p>
          <p>Riceverai un'ulteriore email non appena il tuo profilo sarà stato approvato e potrai iniziare a usare il sistema di matching.</p>
          <p>A presto,<br>Il team di Nexus Digital Bridge</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Errore invio welcome email:", err);
  }
}

/**
 * Invia un'email all'utente per informarlo che il suo account è stato approvato.
 */
export async function sendApprovalEmail(userEmail: string, userName: string) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: 'Nexus Digital Bridge <onboarding@resend.dev>',
      to: [userEmail],
      subject: 'Account Approvato - Benvenuto su Nexus Digital Bridge',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a237e;">
          <h1 style="color: #1a237e;">Ottime notizie, ${userName}!</h1>
          <p>Il tuo account su Nexus Digital Bridge è stato approvato con successo dal nostro team.</p>
          <p>Ora puoi accedere a tutte le funzionalità della piattaforma, inclusi il matching intelligente, la ricerca degli istituti e la chat diretta.</p>
          <div style="margin-top: 30px;">
            <a href="https://nexus-digital-bridge.web.app/login" 
               style="background-color: #1a237e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Accedi alla tua Dashboard Ora
            </a>
          </div>
          <p style="margin-top: 30px;">Buon lavoro!<br>Il team di Nexus Digital Bridge</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Errore invio approval email:", err);
  }
}

/**
 * Invia un'email all'utente per informarlo che la sua richiesta è stata rifiutata.
 */
export async function sendRejectionEmail(userEmail: string, userName: string) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    await resend.emails.send({
      from: 'Nexus Digital Bridge <onboarding@resend.dev>',
      to: [userEmail],
      subject: 'Aggiornamento sulla tua registrazione - Nexus Digital Bridge',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a237e;">
          <h1 style="color: #1a237e;">Ciao ${userName},</h1>
          <p>Ti ringraziamo per l'interesse mostrato verso Nexus Digital Bridge.</p>
          <p>Dopo aver esaminato i dati forniti durante la registrazione, purtroppo non siamo in grado di approvare il tuo account in questo momento.</p>
          <p>Questo può accadere se i dati aziendali o dell'istituto non sono risultati verificabili o conformi alle finalità della piattaforma.</p>
          <p>Se ritieni che ci sia stato un errore, puoi contattarci rispondendo a questa email.</p>
          <p>Cordiali saluti,<br>Il team di Nexus Digital Bridge</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Errore invio rejection email:", err);
  }
}
