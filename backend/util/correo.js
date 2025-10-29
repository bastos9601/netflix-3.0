const nodemailer = require('nodemailer');

function crearTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function enviarCorreo({ para, asunto, texto, html }) {
  const transporter = crearTransporter();
  const from = process.env.SMTP_FROM || 'no-reply@example.com';

  if (!transporter) {
    console.log('[DEV] SMTP no configurado. Simulando envío:', { para, asunto, texto });
    return { ok: false, simulado: true };
  }

  await transporter.sendMail({ from, to: para, subject: asunto, text: texto, html });
  return { ok: true };
}

module.exports = { enviarCorreo };