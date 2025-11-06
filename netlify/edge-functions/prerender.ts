// Netlify Edge Function: Prerender.io integration
const DEFAULT_PRERENDER_TOKEN = 'V85u5WS8kbxdXKCF5KuR';

const CRAWLER_UA_PATTERNS: RegExp[] = [
  /baiduspider/i, /bingbot/i, /duckduckbot/i, /googlebot/i, /yandexbot/i, /slurp/i,
  /sogou/i, /exabot/i, /facebookexternalhit/i, /facebookcatalog/i, /twitterbot/i,
  /linkedinbot/i, /pinterest/i, /embedly/i, /quora link preview/i, /showyoubot/i,
  /outbrain/i, /w3c_validator/i, /redditbot/i, /applebot/i, /whatsapp/i, /telegrambot/i,
  /slackbot/i, /discordbot/i, /vkshare/i, /skypeuripreview/i, /nuzzel/i, /qwantify/i,
  /bitlybot/i, /xing-contenttabreceiver/i, /embedarticles/i, /petalbot/i, /prerender/i
];

const STATIC_EXTENSIONS = [
  '.js', '.mjs', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.otf', '.map', '.txt', '.xml', '.json'
];

function isStaticAsset(pathname: string): boolean {
  return STATIC_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext));
}

function isCrawler(ua: string): boolean {
  if (!ua) return false;
  return CRAWLER_UA_PATTERNS.some((re) => re.test(ua));
}

export default async (request: Request, context: any) => {
  try {
    const url = new URL(request.url);
    const ua = request.headers.get('user-agent') || '';

    if (!['GET', 'HEAD'].includes(request.method)) return context.next();
    if (isStaticAsset(url.pathname)) return context.next();

    const hasEscapedFragment = url.searchParams.has('_escaped_fragment_');

    if (isCrawler(ua) || hasEscapedFragment) {
      const token = (context.env && context.env.PRERENDER_TOKEN) || DEFAULT_PRERENDER_TOKEN;
      const target = `https://service.prerender.io/${url.protocol}//${url.host}${url.pathname}${url.search}`;
      const prerenderResponse = await fetch(target, {
        headers: {
          'X-Prerender-Token': token,
          'User-Agent': ua,
          'Accept-Encoding': 'identity'
        },
        method: 'GET'
      });
      if (!prerenderResponse.ok) return context.next();
      const res = new Response(prerenderResponse.body, { status: prerenderResponse.status, headers: prerenderResponse.headers });
      res.headers.set('content-type', 'text/html; charset=utf-8');
      return res;
    }

    return context.next();
  } catch {
    return context.next();
  }
};

export const config = { path: '/*' };

// Netlify Edge Function: Prerender.io integration
// Routes known crawlers to Prerender.io while serving normal SPA to users

const DEFAULT_PRERENDER_TOKEN = 'V85u5WS8kbxdXKCF5KuR';

const CRAWLER_UA_PATTERNS: RegExp[] = [
  /baiduspider/i,
  /bingbot/i,
  /duckduckbot/i,
  /googlebot/i,
  /yandexbot/i,
  /slurp/i,
  /sogou/i,
  /exabot/i,
  /facebookexternalhit/i,
  /facebookcatalog/i,
  /twitterbot/i,
  /linkedinbot/i,
  /pinterest/i,
  /embedly/i,
  /quora link preview/i,
  /showyoubot/i,
  /outbrain/i,
  /w3c_validator/i,
  /redditbot/i,
  /applebot/i,
  /whatsapp/i,
  /telegrambot/i,
  /slackbot/i,
  /discordbot/i,
  /vkshare/i,
  /skypeuripreview/i,
  /nuzzel/i,
  /qwantify/i,
  /bitlybot/i,
  /xing-contenttabreceiver/i,
  /embedarticles/i,
  /petalbot/i,
  /prerender/i
];

const STATIC_EXTENSIONS = [
  '.js', '.mjs', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.otf', '.map', '.txt', '.xml', '.json'
];

function isStaticAsset(pathname: string): boolean {
  return STATIC_EXTENSIONS.some(ext => pathname.toLowerCase().endsWith(ext));
}

function isCrawler(ua: string): boolean {
  if (!ua) return false;
  return CRAWLER_UA_PATTERNS.some((re) => re.test(ua));
}

export default async (request: Request, context: any) => {
  try {
    const url = new URL(request.url);
    const ua = request.headers.get('user-agent') || '';

    // Only handle GET/HEAD
    if (!['GET', 'HEAD'].includes(request.method)) {
      return context.next();
    }

    // Skip static assets
    if (isStaticAsset(url.pathname)) {
      return context.next();
    }

    // Support _escaped_fragment_ legacy param
    const hasEscapedFragment = url.searchParams.has('_escaped_fragment_');

    if (isCrawler(ua) || hasEscapedFragment) {
      const token = (context.env && context.env.PRERENDER_TOKEN) || DEFAULT_PRERENDER_TOKEN;

      // Build prerender target URL
      // Prerender expects the full original URL appended after service host
      const target = `https://service.prerender.io/${url.protocol}//${url.host}${url.pathname}${url.search}`;

      const prerenderResponse = await fetch(target, {
        headers: {
          'X-Prerender-Token': token,
          'User-Agent': ua,
          // Avoid compressed content issues at the edge
          'Accept-Encoding': 'identity'
        },
        method: 'GET'
      });

      // If Prerender fails, fall back to app
      if (!prerenderResponse.ok) {
        return context.next();
      }

      // Return the prerendered HTML
      const res = new Response(prerenderResponse.body, {
        status: prerenderResponse.status,
        headers: prerenderResponse.headers
      });

      // Ensure HTML content type
      res.headers.set('content-type', 'text/html; charset=utf-8');
      return res;
    }

    // Non-crawler traffic -> continue to SPA
    return context.next();
  } catch (_err) {
    // On any error, do not break prod traffic
    return context.next();
  }
};

export const config = { path: '/*' };

import { HandlerContext } from "https://edge.netlify.com";

// List of crawler user-agents to match against
const CRAWLER_UA = [
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /duckduckbot/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /rogerbot/i,
  /linkedinbot/i,
  /embedly/i,
  /quora\slink\spreview/i,
  /showyoubot/i,
  /outbrain/i,
  /pinterest/i,
  /slackbot/i,
  /vkShare/i,
  /w3c_validator/i,
];

const PRERENDER_TOKEN = "V85u5WS8kbxdXKCF5KuR";
const PRERENDER_SERVICE_URL = "https://service.prerender.io/https://perfume-ambassador.com";

function isCrawler(ua: string | null): boolean {
  if (!ua) return false;
  return CRAWLER_UA.some((re) => re.test(ua));
}

export default async function handler(
  request: Request,
  context: HandlerContext
) {
  const ua = request.headers.get("user-agent");

  if (isCrawler(ua)) {
    const url = new URL(request.url);
    // Construct the prerender service url with the original path
    const prerenderUrl = `${PRERENDER_SERVICE_URL}${url.pathname}${url.search}`;

    try {
      const prerenderRes = await fetch(prerenderUrl, {
        headers: {
          "User-Agent": ua || "",
          "X-Prerender-Token": PRERENDER_TOKEN,
        },
      });

      if (prerenderRes.ok) {
        return prerenderRes;
      }
      // If prerender fails, fall through to normal rendering
      console.warn("Prerender failed", prerenderRes.status);
    } catch (err) {
      console.warn("Error fetching prerender", err);
    }
  }

  // For non-crawlers or on prerender failure, continue to next handler (will serve static/spa)
  return context.next();
}