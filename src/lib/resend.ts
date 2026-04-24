import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export const FROM_EMAIL = "Nexio <hallo@nexio.app>";

// ── Email Templates ───────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, displayName: string) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Willkommen bei Nexio 🎉",
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9fafb;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background: #07c160; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: white;">N</div>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #111; text-align: center; margin: 0 0 8px;">Willkommen bei Nexio, ${displayName}! 🎉</h1>
          <p style="color: #6b7280; text-align: center; margin: 0 0 32px;">Deine Nachrichten. Deine Daten. Dein Europa.</p>

          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #166534; font-weight: 600; margin: 0 0 12px;">Was dich erwartet:</p>
            <p style="color: #15803d; margin: 4px 0;">✅ End-to-End Verschlüsselung — kein Server liest deine Nachrichten</p>
            <p style="color: #15803d; margin: 4px 0;">✅ KI-Assistent direkt im Messenger</p>
            <p style="color: #15803d; margin: 4px 0;">✅ DSGVO-konform, Server in Deutschland</p>
            <p style="color: #15803d; margin: 4px 0;">✅ Kostenlos — keine Werbung, nie</p>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL}/chats"
             style="display: block; background: #07c160; color: white; text-decoration: none; text-align: center; padding: 16px; border-radius: 12px; font-weight: 600; font-size: 16px;">
            Jetzt Nexio öffnen →
          </a>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
            Nexio · DSGVO-konform · Hosted in Deutschland<br>
            Hesselmann Beratung UG · Deutschland
          </p>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPaymentReceipt(
  to: string,
  amount: number,
  currency: string,
  recipient: string
) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Zahlung von ${(amount / 100).toFixed(2)} ${currency} gesendet`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111; margin: 0 0 24px;">Zahlungsbestätigung</h2>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #6b7280; margin: 0 0 4px; font-size: 14px;">Betrag</p>
            <p style="color: #111; font-size: 32px; font-weight: 700; margin: 0;">${(amount / 100).toFixed(2)} ${currency}</p>
          </div>
          <p style="color: #374151; margin: 0 0 8px;"><strong>Empfänger:</strong> ${recipient}</p>
          <p style="color: #374151; margin: 0 0 24px;"><strong>Status:</strong> <span style="color: #07c160;">✓ Erfolgreich</span></p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/payments"
             style="display: block; background: #1677ff; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 10px; font-weight: 600;">
            Zahlungshistorie ansehen
          </a>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendNewMessageNotification(
  to: string,
  senderName: string,
  conversationId: string
) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Neue Nachricht von ${senderName}`,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
            <strong>${senderName}</strong> hat dir eine Nachricht geschickt.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/chats/${conversationId}"
             style="display: block; background: #07c160; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 10px; font-weight: 600;">
            Nachricht lesen →
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
            E-Mail-Benachrichtigungen deaktivieren: Nexio → Profil → Einstellungen
          </p>
        </div>
      </body>
      </html>
    `,
  });
}
