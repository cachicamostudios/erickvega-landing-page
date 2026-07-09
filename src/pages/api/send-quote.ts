import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

// ─── Email HTML templates ─────────────────────────────────────────────────────

function buildEmail(lang: 'en' | 'pt' | 'es'): string {
  const t = <T,>(m: { en: T; pt: T; es: T }): T => m[lang];

  const heading   = t({
    en: 'Thank you for your inquiry',
    pt: 'Obrigado pelo seu contacto',
    es: 'Gracias por tu contacto',
  });
  const intro     = t({
    en: 'Thanks for reaching out. We have received the information you provided and will get in touch with you shortly.',
    pt: 'Obrigado pelo seu contacto. Recebemos os dados que nos forneceu e entraremos em contacto consigo em breve.',
    es: 'Gracias por tu interés. Hemos recibido los datos que nos proporcionaste y pronto nos pondremos en contacto contigo.',
  });
  const servicesH = t({ en: 'Services', pt: 'Serviços', es: 'Servicios' });
  const ctaH      = t({ en: 'In the meantime', pt: 'Entretanto', es: 'Mientras tanto' });
  const ctaBody   = t({
    en: 'You can also reply to this email or contact Erick directly anytime.',
    pt: 'Pode também responder a este email ou contactar o Erick diretamente a qualquer momento.',
    es: 'También puedes responder a este email o contactar a Erick directamente cuando quieras.',
  });
  const ctaBtn    = t({ en: 'Contact Erick', pt: 'Contactar o Erick', es: 'Contactar a Erick' });

  const services = t({
    en: [
      'Wedding films',
      'Event &amp; party coverage',
      'Promotional videos (tourism, business)',
      'Corporate videos',
    ],
    pt: [
      'Filmes de casamento',
      'Cobertura de eventos e festas',
      'Vídeos promocionais (turismo, negócios)',
      'Vídeos corporativos',
    ],
    es: [
      'Vídeos de boda',
      'Cobertura de eventos y fiestas',
      'Vídeos promocionales (turismo, negocios)',
      'Vídeos corporativos',
    ],
  });

  const serviceItems = services.map(s =>
    `<li style="margin:6px 0;font-size:14px;color:#333;">${s}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:32px 40px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Erick Vega<span style="color:#ff5c00;">*</span>
            </p>
            <p style="margin:6px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">
              Filmmaker &amp; Editor · Madeira
            </p>
          </td>
        </tr>

        <!-- Heading -->
        <tr>
          <td style="padding:36px 40px 0;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#0a0a0a;">${heading}</h1>
            <p style="margin:0;font-size:14px;line-height:1.65;color:#555;">${intro}</p>
          </td>
        </tr>

        <!-- Services -->
        <tr>
          <td style="padding:28px 40px 0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#ff5c00;">${servicesH}</p>
            <ul style="margin:0;padding:0 0 0 20px;">${serviceItems}</ul>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#0a0a0a;">${ctaH}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#555;">${ctaBody}</p>
            <a href="mailto:hello@erickvega.xyz"
               style="display:inline-block;background:#ff5c00;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px;letter-spacing:0.3px;">
              ${ctaBtn}
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #eee;">
            <p style="margin:0;font-size:11px;color:#bbb;">erickvega.xyz · Madeira, Portugal</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── API Route ────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  const headers = { 'Content-Type': 'application/json' };

  // Cloudflare Pages exposes dashboard env vars via locals.runtime.env at runtime.
  // import.meta.env is used as fallback for local dev.
  const cfEnv = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {};

  let body: { email?: string; lang?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers });
  }

  const { email, lang = 'en' } = body;
  const normalizedLang: 'en' | 'pt' | 'es' =
    lang === 'pt' ? 'pt' : lang === 'es' ? 'es' : 'en';

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers });
  }

  const apiKey = cfEnv['RESEND_API_KEY'] ?? import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set');
    return new Response(JSON.stringify({ error: 'Not configured' }), { status: 500, headers });
  }

  const resend = new Resend(apiKey);

  const subject =
    normalizedLang === 'en' ? 'Your inquiry — Erick Vega, Filmmaker'
    : normalizedLang === 'es' ? 'Gracias por tu contacto — Erick Vega'
    : 'Obrigado pelo teu contacto — Erick Vega';

  const fromAddress = cfEnv['RESEND_FROM'] ?? import.meta.env.RESEND_FROM ?? 'Erick Vega <onboarding@resend.dev>';

  try {
    await resend.emails.send({
      from: fromAddress,
      to:   email,
      subject,
      html: buildEmail(normalizedLang),
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    console.error('Resend error:', err);
    return new Response(JSON.stringify({ error: 'Send failed' }), { status: 500, headers });
  }
};
