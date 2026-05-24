/**
 * aojs - Autonomous Observability in JavaScript
 * Real-time monitoring and analysis for JavaScript applications
 *
 * Copyright (c) 2024
 * Licensed under the MIT license.
 */

// User agent patterns for mobile devices
const MOBILES_RE = /iPhone|iPad|iPod|Android|Windows Phone|BlackBerry|Opera Mini|IEMobile/i;

// Bot classification patterns
const BOT_CATEGORIES = {
  // AI/LLM Bots
  ai_llm: /GPTBot|ChatGPT|Claude-Web|ClaudeBot|Google-Extended|CCBot|anthropic-ai|OpenAI|Perplexity|AI2Bot|Meta-ExternalAgent|Bytespider|Claude|Bard|Amazonbot|OAI-SearchBot|ChatGPT-User|LinkupBot|DuckAssistBot|LinerBot|newsai/i,

  // Search Engine Crawlers
  search_engines: /Googlebot|bingbot|Baiduspider|YandexBot|DuckDuckBot|Yahoo! Slurp|Slurp|Sogou|Exabot|facebookexternalhit|Applebot|PetalBot|Qwantbot|SeznamBot/i,

  // SEO/Marketing Bots
  seo_marketing: /AhrefsBot|SemrushBot|MJ12bot|DotBot|BLEXBot|SiteAuditBot|LinkpadBot|BrandVerity|DataForSeoBot|SERankingBacklinksBot/i,

  // Social Media Bots
  social_media: /facebookexternalhit|Twitterbot|LinkedInBot|Pinterest|WhatsApp|Slack|Discord|Telegram|SkypeUriPreview|TelegramBot/i,

  // Security/Research Bots
  security_research: /Shodan|Censys|ZoomBot|InternetMeasurement|ResearchScan|SecurityTracker|nuclei/i,

  // Monitoring/Uptime Bots
  monitoring: /UptimeRobot|Pingdom|StatusCake|Site24x7|GTmetrix|WebPageTest|Uptimebot|Monitor|CheckBot|Monit|DreamHost/i,

  // Archive/Backup Bots
  archive: /archive\.org|Wayback|Internet Archive|ArchiveBot|ia_archiver|Wayback Machine/i,

  // Feed/RSS Bots
  feed: /Feedfetcher-Google|FeedBurner|Feedly|RSS|FeedBot|PubSubHubbub|Superfeedr/i,

  // E-commerce/Price Bots
  ecommerce: /ShopBot|PriceBot|Shopping|AmazonProductBot|Shopify|WooCommerce|PriceSpider|Priceonomics/i,

  // Research Crawlers
  research_crawlers: /Walsh-Research|tech-crawler/i,

  // Generic/Other Bots
  generic: /bot|crawler|spider|scraper|PhantomJS|HeadlessChrome|Selenium|curl|wget|HTTPie|Postman|python-requests|Go-http-client/i
};

// Combined bot pattern for backward compatibility
const BOTS_RE = new RegExp(Object.values(BOT_CATEGORIES).map(pattern => pattern.source).join('|'), 'i');

// Browser detection patterns
const BROWSERS = {
  chrome: /Chrome\/(\d+)/,
  firefox: /Firefox\/(\d+)/,
  safari: /Safari\/(\d+)(?!.*Chrome)/,
  edge: /Edg\/(\d+)/,
  opera: /OPR\/(\d+)|Opera\/(\d+)/,
  ie: /MSIE (\d+)|Trident.*rv:(\d+)/
};

// OS detection patterns - order matters for proper detection
const OPERATING_SYSTEMS = {
  windows: /Windows NT (\d+\.\d+)/,
  macos: /Mac OS X (\d+[._]\d+)/,
  android: /Android (\d+\.?\d*)/,
  ios: /OS (\d+[._]\d+) like Mac OS X/,
  linux: /Linux/
};

/**
 * Creates a matcher function for the given regex pattern
 * @param {RegExp} pattern - Regular expression pattern to match
 * @returns {Function} Matcher function
 */
const createMatcher = (pattern) => {
  return (userAgent) => {
    const ua = userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : '');
    return pattern.test(ua);
  };
};

/**
 * Extracts version from user agent string using pattern
 * @param {string} userAgent - User agent string
 * @param {RegExp} pattern - Pattern with version capture group
 * @returns {string|null} Version string or null
 */
const extractVersion = (userAgent, pattern) => {
  const match = userAgent.match(pattern);
  return match ? (match[1] || match[2] || null) : null;
};

/**
 * Detects browser information from user agent
 * @param {string} userAgent - User agent string
 * @returns {Object} Browser name and version
 */
const detectBrowser = (userAgent) => {
  const ua = userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : '');

  for (const [browser, pattern] of Object.entries(BROWSERS)) {
    if (pattern.test(ua)) {
      return {
        name: browser,
        version: extractVersion(ua, pattern)
      };
    }
  }

  return { name: 'unknown', version: null };
};

/**
 * Detects operating system from user agent
 * @param {string} userAgent - User agent string
 * @returns {Object} OS name and version
 */
const detectOS = (userAgent) => {
  const ua = userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : '');

  for (const [os, pattern] of Object.entries(OPERATING_SYSTEMS)) {
    if (pattern.test(ua)) {
      return {
        name: os,
        version: extractVersion(ua, pattern)
      };
    }
  }

  return { name: 'unknown', version: null };
};

/**
 * Detects bot category from user agent
 * @param {string} userAgent - User agent string
 * @returns {Object} Bot detection results
 */
const detectBotCategory = (userAgent) => {
  const ua = userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : '');

  const categories = [];
  for (const [category, pattern] of Object.entries(BOT_CATEGORIES)) {
    if (pattern.test(ua)) {
      categories.push(category);
    }
  }

  return {
    isBot: categories.length > 0,
    categories: categories,
    primaryCategory: categories[0] || null
  };
};

/**
 * Analyzes user agent and provides detailed information
 * @param {string} userAgent - User agent string to analyze
 * @returns {Object} Complete analysis results
 */
const analyze = (userAgent) => {
  const ua = userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : '');
  const botInfo = detectBotCategory(ua);

  return {
    userAgent: ua,
    isMobile: createMatcher(MOBILES_RE)(ua),
    isBot: botInfo.isBot,
    botCategory: botInfo.primaryCategory,
    botCategories: botInfo.categories,
    browser: detectBrowser(ua),
    os: detectOS(ua),
    timestamp: new Date().toISOString()
  };
};

// Export functions
export default {
  isMobile: createMatcher(MOBILES_RE),
  isBot: createMatcher(BOTS_RE),
  detectBrowser,
  detectOS,
  detectBotCategory,
  analyze
};

export {
  createMatcher,
  detectBrowser,
  detectOS,
  detectBotCategory,
  analyze,
  BOT_CATEGORIES
};
