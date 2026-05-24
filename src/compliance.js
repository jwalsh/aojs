/**
 * ao/compliance - Bot compliance assessment
 * Based on walsh-research-compliance/v1.2
 * Spec: https://wal.sh/research/bots/compliance-spec
 */

// R1-R12 requirements from the Walsh-Research spec
export const COMPLIANCE_REQUIREMENTS = {
  R1:  { id: 'R1',  level: 'MUST',   name: 'User-Agent identification', description: 'Exact UA string with product token and contact URL' },
  R2:  { id: 'R2',  level: 'MUST',   name: 'robots.txt compliance',     description: 'RFC 9309 robots.txt parsing and enforcement' },
  R3:  { id: 'R3',  level: 'MUST',   name: 'Operator blocklist',        description: 'Honor operator-maintained blocklist with subdomain matching' },
  R4:  { id: 'R4',  level: 'MUST',   name: 'Rate limiting',             description: 'Min 1s between requests per host' },
  R5:  { id: 'R5',  level: 'MUST',   name: 'Backoff and Retry-After',   description: 'Exponential backoff with cap, honor Retry-After header' },
  R6:  { id: 'R6',  level: 'MUST',   name: 'Stay in scope',             description: 'Only fetch explicitly configured target URLs' },
  R7:  { id: 'R7',  level: 'SHOULD', name: 'Conditional fetch',         description: 'Use If-Modified-Since/ETag to avoid redundant fetches' },
  R8:  { id: 'R8',  level: 'SHOULD', name: 'Infrequent fetching',       description: 'Do not re-fetch unchanged resources more than necessary' },
  R9:  { id: 'R9',  level: 'SHOULD', name: 'Prefer structured formats', description: 'Prefer markdown/JSON over HTML when available' },
  R10: { id: 'R10', level: 'MUST',   name: 'Schema validation',         description: 'Validate blocklist against JSON Schema, cache 7d' },
  R11: { id: 'R11', level: 'SHOULD', name: 'Persistent caches',         description: 'Persist robots.txt and blocklist caches across runs' },
  R12: { id: 'R12', level: 'MUST',   name: 'Cache-miss behavior',       description: 'Stale-while-revalidate with hard cutoff at 2x TTL' },
};

// Attestation tiers (from wal.sh/research/bots/index.org)
export const ATTESTATION_TIERS = {
  0: { tier: 0, name: 'Undeclared',        description: 'No identifying UA, no policy URL' },
  1: { tier: 1, name: 'UA assertion only',  description: 'Identifies via UA string, no policy page' },
  2: { tier: 2, name: 'UA + policy URL',    description: 'UA string with +URL pointing to policy page' },
  3: { tier: 3, name: 'Verifiable contract', description: 'Published spec, test fixtures, self-audit' },
  4: { tier: 4, name: 'Third-party audited', description: 'External verification of compliance claims' },
};

// Operator opt-out standards (what site operators can use)
export const OPT_OUT_STANDARDS = {
  'robots.txt':    { id: 'robots.txt',    spec: 'RFC 9309', adoption: 'universal', description: 'Per-token allow/disallow path rules' },
  'X-Robots-Tag':  { id: 'X-Robots-Tag',  spec: 'Google extension', adoption: 'search_engines', description: 'HTTP header: noindex, nofollow, nosnippet' },
  'meta-robots':   { id: 'meta-robots',    spec: 'HTML spec', adoption: 'search_engines', description: 'HTML <meta name="robots"> tag' },
  'tdmrep':        { id: 'tdmrep',         spec: 'W3C Community Report (2024)', adoption: 'none', description: '/.well-known/tdmrep.json + HTTP headers + ODRL policies' },
  'ai.txt':        { id: 'ai.txt',         spec: 'Spawning.ai', adoption: 'minimal', description: '/ai.txt with toggle-based permissions per content type' },
  'blocklist':     { id: 'blocklist',      spec: 'walsh-research-compliance/v1.2', adoption: 'walsh-research', description: 'JSON blocklist with domain+subdomain matching' },
};

// Training vs RAG token pairs — operators now split by data usage purpose
export const TOKEN_PAIRS = {
  'OpenAI':    { training: 'GPTBot',            search: ['ChatGPT-User', 'OAI-SearchBot'] },
  'Anthropic': { training: 'ClaudeBot',         search: ['Claude-User'] },
  'Google':    { training: 'Google-Extended',    search: ['Googlebot'] },
  'Amazon':    { training: 'Amazonbot',         search: ['Amzn-SearchBot', 'Amzn-User'] },
  'Apple':     { training: 'Applebot-Extended',  search: ['Applebot'] },
  'Meta':      { training: 'meta-externalagent', search: ['FacebookBot'] },
};

// Known bot compliance profiles
// compliance values: true = confirmed, false = confirmed non-compliant, 'partial' = some aspects, 'unknown' = not verified, null = not applicable
export const BOT_COMPLIANCE = {
  'Walsh-Research': {
    category: 'research_crawlers',
    operator: 'Jason Walsh',
    policy_url: 'https://wal.sh/bot/',
    spec_url: 'https://wal.sh/research/bots/compliance-spec',
    robots_token: 'Walsh-Research',
    tier: 3,
    data_usage: 'research',
    opt_out: ['robots.txt', 'blocklist'],
    compliance: { R1: true, R2: true, R3: true, R4: true, R5: true, R6: true, R7: true, R8: true, R9: true, R10: true, R11: true, R12: true },
  },
  'GPTBot': {
    category: 'ai_llm',
    operator: 'OpenAI',
    policy_url: 'https://platform.openai.com/docs/gptbot',
    robots_token: 'GPTBot',
    related_tokens: ['ChatGPT-User', 'OAI-SearchBot'],
    tier: 2,
    data_usage: 'training',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: 'unknown', R5: 'unknown', R6: 'unknown' },
  },
  'ChatGPT-User': {
    category: 'ai_llm',
    operator: 'OpenAI',
    policy_url: 'https://openai.com/bot',
    robots_token: 'ChatGPT-User',
    tier: 2,
    data_usage: 'search',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: 'unknown', R5: 'unknown', R6: 'unknown' },
  },
  'OAI-SearchBot': {
    category: 'ai_llm',
    operator: 'OpenAI',
    policy_url: 'https://openai.com/searchbot',
    robots_token: 'OAI-SearchBot',
    tier: 2,
    data_usage: 'search',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: 'unknown', R5: 'unknown', R6: 'unknown' },
  },
  'ClaudeBot': {
    category: 'ai_llm',
    operator: 'Anthropic',
    policy_url: 'https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler',
    robots_token: 'ClaudeBot',
    related_tokens: ['Claude-User'],
    tier: 2,
    data_usage: 'training',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: 'unknown', R5: 'unknown', R6: 'unknown' },
  },
  'Claude-User': {
    category: 'ai_llm',
    operator: 'Anthropic',
    policy_url: 'https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler',
    robots_token: 'Claude-User',
    related_tokens: ['ClaudeBot'],
    tier: 2,
    data_usage: 'search',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: 'unknown', R5: 'unknown', R6: 'unknown' },
  },
  'Googlebot': {
    category: 'search_engines',
    operator: 'Google',
    policy_url: 'https://developers.google.com/search/docs/crawling-indexing/googlebot',
    robots_token: 'Googlebot',
    tier: 2,
    data_usage: 'search_index',
    opt_out: ['robots.txt', 'X-Robots-Tag', 'meta-robots'],
    compliance: { R1: true, R2: true, R3: null, R4: true, R5: true, R6: true },
  },
  'Google-Extended': {
    category: 'ai_llm',
    operator: 'Google',
    policy_url: 'https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers',
    robots_token: 'Google-Extended',
    tier: 2,
    data_usage: 'training',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: true, R3: null, R4: true, R5: true, R6: true },
  },
  'bingbot': {
    category: 'search_engines',
    operator: 'Microsoft',
    policy_url: 'https://www.bing.com/bingbot.htm',
    robots_token: 'bingbot',
    tier: 2,
    data_usage: 'search_index',
    opt_out: ['robots.txt', 'X-Robots-Tag'],
    compliance: { R1: true, R2: true, R3: null, R4: true, R5: true, R6: true },
  },
  'Amazonbot': {
    category: 'ai_llm',
    operator: 'Amazon',
    policy_url: 'https://developer.amazon.com/support/amazonbot',
    robots_token: 'Amazonbot',
    related_tokens: ['Amzn-SearchBot', 'Amzn-User'],
    ip_verify_url: 'https://developer.amazon.com/amazonbot/ip-addresses/',
    tier: 2,
    data_usage: 'training',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: 'partial', R3: 'unknown', R4: false, R5: 'unknown', R6: 'unknown' },
  },
  'Amzn-SearchBot': {
    category: 'ai_llm',
    operator: 'Amazon',
    policy_url: 'https://developer.amazon.com/support/amazonbot',
    robots_token: 'Amzn-SearchBot',
    related_tokens: ['Amazonbot', 'Amzn-User'],
    ip_verify_url: 'https://developer.amazon.com/amazonbot/searchbot-ip-addresses/',
    tier: 2,
    data_usage: 'search',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: 'unknown', R5: 'unknown', R6: 'unknown' },
  },
  'Bytespider': {
    category: 'ai_llm',
    operator: 'ByteDance',
    policy_url: null,
    robots_token: 'Bytespider',
    tier: 1,
    data_usage: 'training',
    opt_out: ['robots.txt'],
    compliance: { R1: 'partial', R2: 'partial', R3: 'unknown', R4: false, R5: 'unknown', R6: 'unknown' },
  },
  'Meta-ExternalAgent': {
    category: 'ai_llm',
    operator: 'Meta',
    policy_url: 'https://developers.facebook.com/docs/sharing/webmasters/crawler',
    robots_token: 'meta-externalagent',
    tier: 2,
    data_usage: 'training',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: 'unknown', R5: 'unknown', R6: 'unknown' },
  },
  'Applebot': {
    category: 'search_engines',
    operator: 'Apple',
    policy_url: 'https://support.apple.com/en-us/111855',
    robots_token: 'Applebot',
    tier: 2,
    data_usage: 'search_index',
    opt_out: ['robots.txt', 'X-Robots-Tag'],
    compliance: { R1: true, R2: true, R3: null, R4: true, R5: 'unknown', R6: true },
  },
  'DataForSeoBot': {
    category: 'seo_marketing',
    operator: 'DataForSEO',
    policy_url: 'https://dataforseo.com/dataforseo-bot',
    robots_token: 'DataForSeoBot',
    tier: 2,
    data_usage: 'seo_analysis',
    opt_out: ['robots.txt', 'email'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: 'unknown', R5: 'unknown', R6: 'unknown' },
  },
  'SemrushBot': {
    category: 'seo_marketing',
    operator: 'Semrush',
    policy_url: 'https://www.semrush.com/bot.html',
    robots_token: 'SemrushBot',
    tier: 2,
    data_usage: 'seo_analysis',
    opt_out: ['robots.txt', 'email'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: true, R5: 'unknown', R6: 'unknown' },
  },
  'AhrefsBot': {
    category: 'seo_marketing',
    operator: 'Ahrefs',
    policy_url: 'https://ahrefs.com/robot',
    robots_token: 'AhrefsBot',
    tier: 2,
    data_usage: 'seo_analysis',
    opt_out: ['robots.txt', 'web_form'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: true, R5: 'unknown', R6: 'unknown' },
  },
  'MJ12bot': {
    category: 'seo_marketing',
    operator: 'Majestic',
    policy_url: 'https://mj12bot.com/',
    robots_token: 'MJ12bot',
    tier: 2,
    data_usage: 'seo_analysis',
    opt_out: ['robots.txt'],
    compliance: { R1: true, R2: true, R3: 'unknown', R4: 'unknown', R5: 'unknown', R6: 'unknown' },
  },
};

// Extract the robots_token from a User-Agent string
const KNOWN_TOKENS = Object.entries(BOT_COMPLIANCE).map(([name, profile]) => ({
  name,
  token: profile.robots_token,
  pattern: new RegExp(profile.robots_token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
}));

/**
 * Look up the compliance profile for a user-agent string
 * @param {string} userAgent
 * @returns {Object|null} compliance profile or null if unknown
 */
export const assessCompliance = (userAgent) => {
  if (!userAgent) return null;
  for (const { name, pattern } of KNOWN_TOKENS) {
    if (pattern.test(userAgent)) {
      return { name, ...BOT_COMPLIANCE[name] };
    }
  }
  return null;
};

/**
 * Get the attestation tier for a user-agent
 * @param {string} userAgent
 * @returns {Object} tier info
 */
export const getAttestationTier = (userAgent) => {
  const profile = assessCompliance(userAgent);
  if (!profile) return ATTESTATION_TIERS[0];
  return ATTESTATION_TIERS[profile.tier] || ATTESTATION_TIERS[0];
};

/**
 * Get the full compliance matrix as an array
 * @returns {Array} all bot profiles with compliance data
 */
export const getComplianceMatrix = () => {
  return Object.entries(BOT_COMPLIANCE).map(([name, profile]) => ({
    name,
    ...profile,
  }));
};

/**
 * Check if a bot is compliant with a specific requirement
 * @param {string} userAgent
 * @param {string} requirement - e.g. 'R1', 'R2'
 * @returns {boolean|string|null} true/false/'partial'/'unknown'/null
 */
export const isCompliant = (userAgent, requirement) => {
  const profile = assessCompliance(userAgent);
  if (!profile) return null;
  return profile.compliance[requirement] ?? null;
};
