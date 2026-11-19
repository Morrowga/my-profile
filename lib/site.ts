/**
 * The public address of the site, used for link previews (WhatsApp, LinkedIn, Facebook, X, Slack, Telegram...).
 * It decides the address of the page and of the preview picture that those platforms download.
 *
 * Set SITE_URL in Vercel (Settings -> Environment Variables) to the real domain, for example https://yourdomain.com,
 * and redeploy. Until then the vercel.app address is used, which always works.
 */
const raw = process.env.SITE_URL?.trim();
const withScheme = raw ? (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) : 'https://thihaeung.vercel.app';

export const SITE_URL = withScheme.replace(/\/+$/, '');
export const SITE_HOST = new URL(SITE_URL).host;

export const SITE_NAME = 'Thiha Aung Portfolio';
export const TITLE = 'THIHA AUNG — Software Engineer';
export const DESCRIPTION = 'Software Engineer — building intelligent systems with style';
