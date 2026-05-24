# ao - Bot Compliance and User-Agent Classification

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/ao)](https://www.npmjs.com/package/ao)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)

Classify bots by what they claim and what they owe. `ao` identifies AI/LLM crawlers, assesses their compliance with site operator opt-out mechanisms (robots.txt, ai.txt, TDMRep), and maps the obligations between bots and the sites they crawl.

## Why

AI crawlers now account for significant web traffic. Site operators need to know:

- **Who is crawling?** — Is this GPTBot, ClaudeBot, or an undeclared scraper?
- **What do they claim?** — Do they identify themselves? Do they publish a policy URL?
- **Are they compliant?** — Do they honor robots.txt, rate limits, and opt-out signals?
- **Training vs. search** — Is the bot collecting data for model training or serving search results?

`ao` answers these questions by classifying user agents against a compliance framework with 12 requirements (R1-R12) and 5 attestation tiers.

## Installation

```bash
npm install ao
```

## Compliance Assessment

The core of the library: assess whether a bot meets its obligations to site operators.

```javascript
import { assessCompliance, isCompliant, getAttestationTier } from 'ao/compliance';

// Assess a bot's compliance profile
const profile = assessCompliance('Walsh-Research/1.0 (+https://wal.sh/bot/)');
// {
//   name: 'Walsh-Research',
//   category: 'research_crawlers',
//   operator: 'Jason Walsh',
//   policy_url: 'https://wal.sh/bot/',
//   attestation_tier: 3,   // Verifiable contract
//   compliance: { R1: true, R2: true, R3: true, ... }
// }

// Quick compliance check
isCompliant('Walsh-Research/1.0');  // true (meets all MUST requirements)
isCompliant('Amazonbot/1.0');       // false (R4 rate limiting non-compliant)

// Attestation tier (0-4)
getAttestationTier('GPTBot/1.0');   // 2 — UA + policy URL
getAttestationTier('SomeBot/1.0');  // 0 — Undeclared
```

### Compliance Requirements (R1-R12)

| ID | Level | Requirement | Description |
|----|-------|-------------|-------------|
| R1 | MUST | User-Agent identification | Exact UA string with product token and contact URL |
| R2 | MUST | robots.txt compliance | RFC 9309 parsing and enforcement |
| R3 | MUST | Operator blocklist | Honor operator-maintained blocklist with subdomain matching |
| R4 | MUST | Rate limiting | Min 1s between requests per host |
| R5 | MUST | Backoff and Retry-After | Exponential backoff, honor Retry-After header |
| R6 | MUST | Stay in scope | Only fetch explicitly configured target URLs |
| R7 | SHOULD | Conditional fetch | Use If-Modified-Since/ETag |
| R8 | SHOULD | Infrequent fetching | Don't re-fetch unchanged resources |
| R9 | SHOULD | Prefer structured formats | Prefer markdown/JSON over HTML |
| R10 | MUST | Schema validation | Validate blocklist against JSON Schema |
| R11 | SHOULD | Persistent caches | Persist robots.txt and blocklist caches |
| R12 | MUST | Cache-miss behavior | Stale-while-revalidate with hard cutoff at 2x TTL |

### Attestation Tiers

| Tier | Name | Description |
|------|------|-------------|
| 0 | Undeclared | No identifying UA, no policy URL |
| 1 | UA assertion only | Identifies via UA string, no policy page |
| 2 | UA + policy URL | UA string with +URL pointing to policy page |
| 3 | Verifiable contract | Published spec, test fixtures, self-audit |
| 4 | Third-party audited | External verification of compliance claims |

### Training vs. Search Token Pairs

AI operators split crawlers by purpose. Site operators can block training while allowing search:

| Operator | Training Token | Search Tokens |
|----------|---------------|---------------|
| OpenAI | GPTBot | ChatGPT-User, OAI-SearchBot |
| Anthropic | ClaudeBot | Claude-User |
| Google | Google-Extended | Googlebot |
| Amazon | Amazonbot | Amzn-SearchBot |
| Apple | Applebot-Extended | Applebot |
| Meta | meta-externalagent | FacebookBot |

### Opt-Out Standards

```javascript
import { OPT_OUT_STANDARDS } from 'ao/compliance';
```

| Standard | Spec | Adoption |
|----------|------|----------|
| robots.txt | RFC 9309 | Universal |
| X-Robots-Tag | Google extension | Search engines |
| meta robots | HTML spec | Search engines |
| TDMRep | W3C Community Report (2024) | Minimal |
| ai.txt | Spawning.ai | Minimal |
| blocklist | walsh-research-compliance/v1.2 | Walsh-Research |

## Bot Classification

Classify any user agent into 9 categories:

```javascript
import ao from 'ao';

const result = ao.detectBotCategory('GPTBot/1.0');
// { isBot: true, categories: ['ai_llm'], primaryCategory: 'ai_llm' }
```

| Category | Description | Examples |
|----------|-------------|----------|
| **ai_llm** | AI and LLM crawlers | GPTBot, ChatGPT, ClaudeBot, CCBot, Perplexity |
| **search_engines** | Search engine crawlers | Googlebot, Bingbot, Baidu, Yandex |
| **seo_marketing** | SEO and marketing tools | AhrefsBot, SemrushBot, MJ12bot |
| **social_media** | Social platform crawlers | Facebook, Twitter, LinkedIn |
| **security_research** | Security scanners | Shodan, Censys, nuclei |
| **monitoring** | Uptime and monitoring | UptimeRobot, Pingdom, Monit |
| **archive** | Web archiving services | Internet Archive, Wayback Machine |
| **feed** | RSS and feed readers | Feedfetcher, FeedBurner, Feedly |
| **ecommerce** | Shopping and price bots | PriceBot, ShopBot |

## Access Log Analysis

Analyze Apache/Nginx access logs to understand bot traffic patterns:

```javascript
import { parseLogLine, analyzeUserAgents } from 'ao/log-analyzer';

// Parse a single log line
const entry = parseLogLine(
  '45.88.191.147 - - [23/May/2026:00:40:48 -0700] "GET /page HTTP/1.1" 200 66470 "-" "GPTBot/1.0"'
);

// Analyze log file contents
const lines = logContent.split('\n');
const parsed = lines.map(parseLogLine).filter(Boolean);
const report = analyzeUserAgents(parsed);
// { total, mobile, bots, botCategories: { ai_llm: 50, search_engines: 200, ... } }
```

```bash
# CLI analysis
node dist/log-analyzer.js /path/to/access.log
make analyze
```

## User-Agent Detection

Basic device, browser, and OS detection:

```javascript
import ao from 'ao';

ao.isMobile('Mozilla/5.0 (iPhone...)');  // true
ao.isBot('Googlebot/2.1');               // true
ao.detectBrowser('...Chrome/96...');     // { name: 'chrome', version: '96' }
ao.detectOS('...Windows NT 10.0...');    // { name: 'windows', version: '10.0' }
ao.analyze(userAgent);                   // full analysis object
```

## Server-Side Usage

```javascript
import express from 'express';
import ao from 'ao';
import { assessCompliance } from 'ao/compliance';

app.use((req, res, next) => {
  const ua = req.headers['user-agent'];
  const botInfo = ao.detectBotCategory(ua);

  if (botInfo.isBot && botInfo.primaryCategory === 'ai_llm') {
    const compliance = assessCompliance(ua);

    // Block non-compliant AI crawlers
    if (!compliance || compliance.attestation_tier < 2) {
      return res.status(403).send('Unidentified AI crawler');
    }

    // Signal no-training to compliant crawlers
    res.setHeader('X-Robots-Tag', 'noai, noimageai');
  }

  next();
});
```

## Development

```bash
git clone https://github.com/jwalsh/aojs.git
cd aojs
make              # clean, install, build, test
make test         # run 55 tests
make lint         # eslint
```

### Release

```bash
make release-patch    # bump patch, push (CI publishes via OIDC)
make release-minor    # bump minor
make release-major    # bump major
make registry-status  # view npm dist-tags and versions
```

## License

MIT - see [LICENSE-MIT](LICENSE-MIT).
