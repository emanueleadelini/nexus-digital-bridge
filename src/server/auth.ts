import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db/client";
import nodemailer from "nodemailer";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3000";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  trustedOrigins: [
    "https://nexusdigitalbridge.it",
    "https://www.nexusdigitalbridge.it",
    "http://localhost:3000",
    "http://127.0.0.1:8812",
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
    sendResetPassword: async ({ user: u, url }) => {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "127.0.0.1",
          port: Number(process.env.SMTP_PORT || 25),
          secure: false,
          tls: { rejectUnauthorized: false },
        });
        await transporter.sendMail({
          from: process.env.MAIL_FROM || "Nexus Digital Bridge <noreply@nexusdigitalbridge.it>",
          to: u.email,
          subject: "Reimposta la tua password - Nexus Digital Bridge",
          html: `<div style="font-family:sans-serif;padding:20px;color:#1a237e;border:1px solid #eee;border-radius:12px">
<h1 style="color:#1a237e">Reimposta password</h1>
<p>Hai richiesto di reimpostare la password del tuo account. Se non sei stato tu, ignora questa email.</p>
<div style="margin-top:30px"><a href="${url}" style="background-color:#1a237e;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Reimposta Password</a></div>
<p style="margin-top:20px;font-size:12px;color:#666">Il link scade tra un'ora.</p></div>`,
        });
      } catch (e) {
        console.error("[auth] reset password mail failed:", (e as Error).message);
      }
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "Pending", input: false },
      status: { type: "string", required: false, defaultValue: "Pending", input: false },
      firstName: { type: "string", required: false, input: true },
      lastName: { type: "string", required: false, input: true },
    },
  },
  plugins: [nextCookies()],
});
