// services/mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { winstonLogger } from "../config/logger.js";

dotenv.config();

const FROM =
  process.env.MAIL_FROM ||
  `"Bookstore" <${process.env.SMTP_USER || "12alidawood@gmail.com"}>`;

function buildSmtpTransporter() {
  const host   = process.env.SMTP_HOST || "smtp.gmail.com";
  const port   = Number(process.env.SMTP_PORT || 465);
  const secure = true; // 465 مع TLS

  const user = process.env.SMTP_USER;
  const raw  = process.env.SMTP_PASS || "";
  const pass = raw.replace(/\s+/g, "");

  return nodemailer.createTransport(
    {
      host,
      port,
      secure,
      auth: { user, pass },
      pool: true,
      maxConnections: 1,
      maxMessages: 50,
      rateDelta: 1000,
      rateLimit: 1,
      family: 4,                // إجبار IPv4 لتفادي مشاكل IPv6
      requireTLS: true,
      tls: { minVersion: "TLSv1.2", servername: host, rejectUnauthorized: true },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000
    },
    { from: FROM }
  );
}

let transporter;
function getTransporter() {
  if (!transporter) transporter = buildSmtpTransporter();
  return transporter;
}


function shouldRebuildTransport(err) {
  const code = (err && (err.code || err.responseCode)) || "";
  const msg  = (err && err.message) || "";
  return (
    code === "ECONNECTION" ||
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    /Connection closed|read ECONNRESET|Client network socket/i.test(msg)
  );
}

export async function verifyEmailTransport() {
  try {
    const t = getTransporter();
    await t.verify();
    winstonLogger.info("Email transporter verified successfully");
    return true;
  } catch (error) {
    winstonLogger.error("Email transporter verification failed:", error.message);
    return false;
  }
}

async function sendWithRetry({ to, subject, html }, attempt = 1) {
  const t = getTransporter();
  try {
    const info = await t.sendMail({ to, subject, html, from: FROM, sender: FROM });
    winstonLogger.info(`Email sent to ${to} (${subject}) id=${info.messageId}`);
    return true;
  } catch (err) {
    winstonLogger.error(`sendMail failed (attempt ${attempt}):`, err.message);

    if (attempt >= 3 || !shouldRebuildTransport(err)) throw err;

   
    try { t.close(); } catch {}
    transporter = null;
    await new Promise(r => setTimeout(r, 500 * attempt));
    return sendWithRetry({ to, subject, html }, attempt + 1);
  }
}

export async function sendMail({ to, subject, html }) {
  if (!to) {
    winstonLogger.warn("No email recipient provided.");
    return;
  }
  return sendWithRetry({ to, subject, html });
}
