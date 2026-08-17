import { Resend } from 'resend'
import { COMPANY, LAUNCH_DATE, SOCIALS } from '@/lib/constants'
import { SOURCE_CLAIM } from '@/lib/departments'

/**
 * Waitlist confirmation.
 *
 * Separate from sendNotification.ts on purpose. That module is nodemailer over
 * SMTP with a Gmail fallback, which is fine for a handful of ops mails to one
 * inbox and wrong for mail sent to strangers: Gmail caps around 500 a day and
 * transactional mail from it lands in spam at volume. This one path goes
 * through Resend; the clearance and ops mail is left alone.
 *
 * Requires RESEND_API_KEY, and RESEND_FROM as a verified sender on the domain.
 * If either is missing this does nothing and says so in the log — a waitlist
 * that stops accepting signups because mail is misconfigured would be a far
 * worse failure than a signup with no receipt.
 */

/** Only ever sent to people who gave us an address. Phone signups get nothing —
    see the note in the route. */
export type ConfirmationLang = 'en' | 'ta'

function launchDay(lang: ConfirmationLang): string {
  return new Intl.DateTimeFormat(lang === 'ta' ? 'ta-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(LAUNCH_DATE))
}

const COPY = {
  en: (day: string) => ({
    subject: 'You’re on the HataD list',
    heading: 'You’re on the list.',
    body: [
      `We’ll write once more, on ${day}, the day HataD opens. Nothing between now and then.`,
      `HataD reads ${SOURCE_CLAIM} Tamil Nadu government departments and courts: registration, revenue, survey, forest, highways, planning. You get one report on a plot before you pay for it.`,
    ],
    closing: 'The list goes first.',
  }),
  ta: (day: string) => ({
    subject: 'நீங்கள் HataD பட்டியலில் இணைந்துவிட்டீர்கள்',
    heading: 'பட்டியலில் இணைந்துவிட்டீர்கள்.',
    body: [
      `HataD தொடங்கும் நாளான ${day} அன்று, இன்னும் ஒரு முறை மட்டும் உங்களுக்கு எழுதுவோம். அதுவரை வேறு எந்த மின்னஞ்சலும் இல்லை.`,
      `பதிவுத்துறை, வருவாய், அளவை, வனம், நெடுஞ்சாலை, நகர அமைப்பு உள்ளிட்ட ${SOURCE_CLAIM} அரசுத் துறைகள் மற்றும் நீதிமன்றங்களின் ஆவணங்களைப் படித்து, பணம் கொடுப்பதற்கு முன் ஒரே அறிக்கையாகத் தருகிறோம்.`,
    ],
    closing: 'பட்டியலில் உள்ளவர்களுக்கு முதல் இடம்.',
  }),
}

/*
 * Plain, narrow, and inline-styled.
 *
 * No images and no external stylesheet: mail clients strip <style> blocks and
 * block remote images by default, so anything that depends on either arrives
 * broken. The palette is the site's, so the mail reads as the same company.
 */
function html(lang: ConfirmationLang, shareUrl: string | null): string {
  const t = COPY[lang](launchDay(lang))
  const paras = t.body
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3D5278">${p}</p>`,
    )
    .join('')

  /* Only when the queue is real — a share line with no code behind it would be
     the same lie the page refuses to tell. */
  const share = shareUrl
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#3D5278">${
        lang === 'ta'
          ? 'உங்கள் இணைப்பில் யாரேனும் இணைந்தால், நீங்கள் பட்டியலில் மூன்று இடங்கள் முன்னேறுவீர்கள்:'
          : 'Every person who joins on your link moves you up three places:'
      }<br><a href="${shareUrl}" style="color:#1B4FD8;word-break:break-all">${shareUrl}</a></p>`
    : ''

  return `<!doctype html><html lang="${lang}"><body style="margin:0;padding:0;background:#F4F7FC">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FC">
<tr><td align="center" style="padding:40px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #CBD5E8">
<tr><td style="padding:32px 32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="font-size:13px;letter-spacing:0.28em;font-weight:700;color:#0C1525">HATAD</div>
<div style="width:32px;height:1px;background:#C9A84C;margin:14px 0 22px"></div>
<h1 style="margin:0 0 18px;font-size:21px;line-height:1.3;font-weight:700;color:#0C1525">${t.heading}</h1>
${paras}${share}
<p style="margin:26px 0 0;font-size:15px;font-weight:600;color:#0C1525">${t.closing}</p>
</td></tr>
<tr><td style="padding:18px 32px 26px;border-top:1px solid #CBD5E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#7A8FAD">
${COMPANY.legalName} · ${COMPANY.city}, ${COMPANY.region}<br>
<a href="mailto:${COMPANY.email}" style="color:#7A8FAD">${COMPANY.email}</a>
${SOCIALS.map((s) => ` · <a href="${s.href}" style="color:#7A8FAD">${s.label}</a>`).join('')}
</td></tr>
</table></td></tr></table></body></html>`
}

/** Text alternative. Clients that show it are usually the strict ones, and a
    mail with no text part scores worse with spam filters. */
function text(lang: ConfirmationLang, shareUrl: string | null): string {
  const t = COPY[lang](launchDay(lang))
  return [`HATAD`, ``, t.heading, ``, ...t.body, shareUrl ? `\n${shareUrl}` : '', ``, t.closing]
    .filter((l) => l !== '')
    .join('\n')
}

/**
 * Fire-and-forget. Never throws, never blocks the signup.
 *
 * The caller does not await this: the row is already committed by the time it
 * runs, and a Resend outage must not turn a captured lead into a 500.
 */
export function sendWaitlistConfirmation(opts: {
  to: string
  lang: ConfirmationLang
  shareUrl: string | null
}): void {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!key || !from) {
    console.warn('Waitlist confirmation skipped: RESEND_API_KEY or RESEND_FROM not set')
    return
  }

  const t = COPY[opts.lang](launchDay(opts.lang))
  new Resend(key).emails
    .send({
      from,
      to: opts.to,
      /*
       * Replies go to a mailbox that exists.
       *
       * Verifying a domain in Resend authorises *sending* from it; it does not
       * create an inbox. Without this, anyone replying to the confirmation —
       * and on a waitlist for a land-verification service, people will reply
       * with questions about their plot — would be writing into a void.
       */
      replyTo: COMPANY.email,
      subject: t.subject,
      html: html(opts.lang, opts.shareUrl),
      text: text(opts.lang, opts.shareUrl),
    })
    .then(({ error }) => {
      if (error) console.error('Waitlist confirmation failed:', error.message)
    })
    .catch((e) => console.error('Waitlist confirmation threw:', e))
}
