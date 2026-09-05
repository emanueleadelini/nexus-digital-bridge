'use server';

import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/rate-limit';
import { getCallerProfile, requireAdminCaller } from '@/lib/server-auth';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nexusdigitalbridge.it';
// Mittente di prova Resend: da sostituire col dominio verificato (vedi B3).
const FROM = 'Nexus Digital Bridge <onboarding@resend.dev>';

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) {
    console.warn("RESEND_API_KEY o ADMIN_EMAIL non configurati nelle variabili d'ambiente.");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/** Escape minimo per i valori dentro l'HTML delle email. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface NotifyAdminInput {
  email: string;
  role: string;
  name: string;
  idToken: string;
}

/**
 * Avvisa l'amministratore di una nuova registrazione.
 * Ammessa solo all'utente appena registrato (l'email deve coincidere
 * con quella del token), con rate limit anti-spam.
 */
export async function notifyAdminOfNewUser({ email, role, name, idToken }: NotifyAdminInput) {
  try {
    const caller = await getCallerProfile(idToken);
    if (caller.email?.toLowerCase() !== email.trim().toLowerCase()) {
      return { success: false as const, error: 'forbidden' as const };
    }
    const quota = checkRateLimit(`notify:${caller.uid}`, { limit: 3, windowMs: 60 * 60 * 1000 });
    if (!quota.allowed) {
      return { success: false as const, error: 'rate_limited' as const };
    }

    const resend = getResend();
    if (!resend) return { success: false as const, error: 'config_missing' as const };

    await resend.emails.send({
      from: FROM,
      to: [process.env.ADMIN_EMAIL as string],
      subject: `Nuova Registrazione in Attesa: ${esc(role)}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a237e; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #1a237e;">Nuovo Utente su Nexus Digital Bridge</h1>
          <p>Un nuovo utente ha completato la registrazione e attende l'approvazione per accedere alla piattaforma.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Nome/Ragione Sociale:</strong> ${esc(name)}</li>
            <li style="margin-bottom: 10px;"><strong>Email:</strong> ${esc(email)}</li>
            <li style="margin-bottom: 10px;"><strong>Ruolo Richiesto:</strong> ${esc(role)}</li>
          </ul>
          <div style="margin-top: 30px;">
            <a href="${APP_BASE_URL}/admin/users"
               style="background-color: #ff9800; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Vai alla Dashboard Admin per Approvare
            </a>
          </div>
        </div>
      `,
    });
    return { success: true as const };
  } catch (err) {
    console.error('Errore notifica admin:', err);
    return { success: false as const, error: 'send_failed' as const };
  }
}

/**
 * Email di cortesia all'utente appena registrato.
 * Solo al proprietario del token, con rate limit.
 */
export async function sendWelcomePendingEmail(userEmail: string, userName: string, idToken: string) {
  try {
    const caller = await getCallerProfile(idToken);
    if (caller.email?.toLowerCase() !== userEmail.trim().toLowerCase()) {
      return { success: false as const, error: 'forbidden' as const };
    }
    const quota = checkRateLimit(`welcome:${caller.uid}`, { limit: 3, windowMs: 60 * 60 * 1000 });
    if (!quota.allowed) {
      return { success: false as const, error: 'rate_limited' as const };
    }

    const resend = getResend();
    if (!resend) return { success: false as const, error: 'config_missing' as const };

    await resend.emails.send({
      from: FROM,
      to: [userEmail],
      subject: 'Registrazione ricevuta - Nexus Digital Bridge',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a237e;">
          <h1 style="color: #1a237e;">Benvenuto su Nexus Digital Bridge, ${esc(userName)}!</h1>
          <p>Grazie per esserti registrato sulla nostra piattaforma.</p>
          <p>Ti informiamo che la tua richiesta è attualmente in fase di verifica da parte del nostro team amministrativo. Questo processo di solito richiede meno di 24 ore.</p>
          <p>Riceverai un'ulteriore email non appena il tuo profilo sarà stato approvato e potrai iniziare a usare il sistema di matching.</p>
          <p>A presto,<br>Il team di Nexus Digital Bridge</p>
        </div>
      `,
    });
    return { success: true as const };
  } catch (err) {
    console.error('Errore invio welcome email:', err);
    return { success: false as const, error: 'send_failed' as const };
  }
}

/**
 * Email di approvazione. Solo admin verificato e approvato.
 */
export async function sendApprovalEmail(userEmail: string, userName: string, idToken: string) {
  try {
    await requireAdminCaller(idToken);

    const resend = getResend();
    if (!resend) return { success: false as const, error: 'config_missing' as const };

    await resend.emails.send({
      from: FROM,
      to: [userEmail],
      subject: 'Account Approvato - Benvenuto su Nexus Digital Bridge',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a237e;">
          <h1 style="color: #1a237e;">Ottime notizie, ${esc(userName)}!</h1>
          <p>Il tuo account su Nexus Digital Bridge è stato approvato con successo dal nostro team.</p>
          <p>Ora puoi accedere a tutte le funzionalità della piattaforma, inclusi il matching intelligente, la ricerca degli istituti e la chat diretta.</p>
          <div style="margin-top: 30px;">
            <a href="${APP_BASE_URL}/login"
               style="background-color: #1a237e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Accedi alla tua Dashboard Ora
            </a>
          </div>
          <p style="margin-top: 30px;">Buon lavoro!<br>Il team di Nexus Digital Bridge</p>
        </div>
      `,
    });
    return { success: true as const };
  } catch (err) {
    console.error('Errore invio approval email:', err);
    return { success: false as const, error: 'send_failed' as const };
  }
}

/**
 * Email di rifiuto. Solo admin verificato e approvato.
 */
export async function sendRejectionEmail(userEmail: string, userName: string, idToken: string) {
  try {
    await requireAdminCaller(idToken);

    const resend = getResend();
    if (!resend) return { success: false as const, error: 'config_missing' as const };

    await resend.emails.send({
      from: FROM,
      to: [userEmail],
      subject: 'Aggiornamento sulla tua registrazione - Nexus Digital Bridge',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a237e;">
          <h1 style="color: #1a237e;">Ciao ${esc(userName)},</h1>
          <p>Ti ringraziamo per l'interesse mostrato verso Nexus Digital Bridge.</p>
          <p>Dopo aver esaminato i dati forniti durante la registrazione, purtroppo non siamo in grado di approvare il tuo account in questo momento.</p>
          <p>Questo può accadere se i dati aziendali o dell'istituto non sono risultati verificabili o conformi alle finalità della piattaforma.</p>
          <p>Se ritieni che ci sia stato un errore, puoi contattarci rispondendo a questa email.</p>
          <p>Cordiali saluti,<br>Il team di Nexus Digital Bridge</p>
        </div>
      `,
    });
    return { success: true as const };
  } catch (err) {
    console.error('Errore invio rejection email:', err);
    return { success: false as const, error: 'send_failed' as const };
  }
}
