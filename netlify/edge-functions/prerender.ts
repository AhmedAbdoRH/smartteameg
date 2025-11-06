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