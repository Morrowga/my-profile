/**
 * The public address of the site, used for link previews (WhatsApp, LinkedIn, Facebook, X, Slack, Telegram...).
 * It decides the address of the page and of the preview picture that those platforms download.
 *
 * The domain is thihaaung.tech. SITE_URL (Vercel -> Settings -> Environment Variables) can override it, for example for a test domain.
 */
const raw = process.env.SITE_URL?.trim();
const withScheme = raw ? (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) : 'https://www.thihaaung.tech';

export const SITE_URL = withScheme.replace(/\/+$/, '');
export const SITE_HOST = new URL(SITE_URL).host.replace(/^www\./, '');   // shown in the preview picture, without www.

export const SITE_NAME = 'Thiha Aung Portfolio';
export const TITLE = 'THIHA AUNG — Software Engineer';
export const DESCRIPTION = 'Software Engineer — building intelligent systems with style';
