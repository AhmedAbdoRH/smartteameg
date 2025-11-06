// Netlify Edge Function: Prerender.io integration (clean single implementation)
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