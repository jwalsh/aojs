# User Agent Detection Library for JavaScript

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-blue)](https://www.ecma-international.org/ecma-262/)
[![Test Coverage](https://img.shields.io/badge/tests-36%20passing-success)](test/)
[![Bot Detection](https://img.shields.io/badge/bot%20categories-9-informational)](src/index.js)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)

A lightweight, modern JavaScript library for detecting mobile devices, bots, browsers, and operating systems through user agent analysis. Features advanced bot categorization including AI/LLM bot detection.

## Features

- 🔍 **Device Detection** - Identify mobile devices (iPhone, iPad, Android, etc.)
- 🤖 **Advanced Bot Detection** - Categorize bots into 9 distinct categories
- 🧠 **AI/LLM Bot Detection** - Identify GPTBot, Claude, ChatGPT, and other AI crawlers
- 🌐 **Browser Detection** - Identify browser types and versions
- 💻 **OS Detection** - Detect operating systems and versions
- 📊 **Log Analysis** - Analyze Apache/Nginx access logs
- ⚡ **Lightweight** - Zero dependencies, pure JavaScript
- 🚀 **Modern** - ES6+ modules, works with Node.js 18+

## Installation

```bash
npm install ao
```

## Quick Start

### Basic Usage

```javascript
import ao from 'ao';

// Check if user agent is mobile
const isMobile = ao.isMobile('Mozilla/5.0 (iPhone...)');
console.log(isMobile); // true

// Check if user agent is a bot
const isBot = ao.isBot('Googlebot/2.1');
console.log(isBot); // true

// Get complete analysis
const analysis = ao.analyze('Mozilla/5.0 (iPhone; CPU iPhone OS 15_2...)');
console.log(analysis);
```

### Bot Category Detection

```javascript
import ao from 'ao';

// Detect AI/LLM bots
const gptBot = ao.detectBotCategory('GPTBot/1.0');
console.log(gptBot);
// {
//   isBot: true,
//   categories: ['ai_llm'],
//   primaryCategory: 'ai_llm'
// }

// Detect search engine bots
const googleBot = ao.detectBotCategory('Googlebot/2.1');
console.log(googleBot);
// {
//   isBot: true,
//   categories: ['search_engines'],
//   primaryCategory: 'search_engines'
// }

// Multiple category detection
const fbBot = ao.detectBotCategory('facebookexternalhit/1.1; Googlebot/2.1');
console.log(fbBot);
// {
//   isBot: true,
//   categories: ['search_engines', 'social_media'],
//   primaryCategory: 'search_engines'
// }
```

## Bot Categories

The library categorizes bots into 9 distinct types:

| Category | Description | Examples |
|----------|-------------|----------|
| **ai_llm** | AI and LLM crawlers | GPTBot, ChatGPT, Claude-Web, ClaudeBot, CCBot, Perplexity |
| **search_engines** | Search engine crawlers | Googlebot, Bingbot, Baidu, Yandex, DuckDuckBot |
| **seo_marketing** | SEO and marketing tools | AhrefsBot, SemrushBot, MJ12bot, DotBot |
| **social_media** | Social platform crawlers | Facebook, Twitter, LinkedIn, Pinterest, WhatsApp |
| **security_research** | Security scanners | Shodan, Censys, nuclei, SecurityTracker |
| **monitoring** | Uptime and monitoring | UptimeRobot, Pingdom, StatusCake, GTmetrix |
| **archive** | Web archiving services | Internet Archive, Wayback Machine |
| **feed** | RSS and feed readers | Feedfetcher, FeedBurner, Feedly |
| **ecommerce** | Shopping and price bots | PriceBot, ShopBot, Amazon, Shopify |

## API Reference

### Core Functions

#### `isMobile(userAgent?)`
Returns `true` if the user agent represents a mobile device.

```javascript
ao.isMobile('Mozilla/5.0 (iPhone...)'); // true
ao.isMobile(); // Uses window.navigator.userAgent
```

#### `isBot(userAgent?)`
Returns `true` if the user agent represents any type of bot.

```javascript
ao.isBot('Googlebot/2.1'); // true
ao.isBot('GPTBot/1.0'); // true
```

#### `detectBotCategory(userAgent?)`
Returns detailed bot categorization information.

```javascript
const botInfo = ao.detectBotCategory('GPTBot/1.0');
// Returns: {
//   isBot: true,
//   categories: ['ai_llm'],
//   primaryCategory: 'ai_llm'
// }
```

#### `detectBrowser(userAgent?)`
Returns browser information with name and version.

```javascript
const browser = ao.detectBrowser('Mozilla/5.0... Chrome/96.0.4664.110');
// Returns: { name: 'chrome', version: '96' }
```

Supported browsers:
- Chrome
- Firefox
- Safari
- Edge
- Opera
- Internet Explorer

#### `detectOS(userAgent?)`
Returns operating system information.

```javascript
const os = ao.detectOS('Mozilla/5.0 (Windows NT 10.0...)');
// Returns: { name: 'windows', version: '10.0' }
```

Supported operating systems:
- Windows
- macOS
- Linux
- Android
- iOS

#### `analyze(userAgent?)`
Returns comprehensive analysis of the user agent.

```javascript
const analysis = ao.analyze('Mozilla/5.0 (compatible; GPTBot/1.0)');
// Returns: {
//   userAgent: 'Mozilla/5.0 (compatible; GPTBot/1.0)',
//   isMobile: false,
//   isBot: true,
//   botCategory: 'ai_llm',
//   botCategories: ['ai_llm'],
//   browser: { name: 'unknown', version: null },
//   os: { name: 'unknown', version: null },
//   timestamp: '2024-01-01T00:00:00.000Z'
// }
```

## Log Analysis

The library includes a powerful log analyzer for processing Apache/Nginx access logs.

### Basic Log Analysis

```bash
# Analyze access logs
node dist/log-analyzer.js /path/to/access.log

# Or use the Makefile
make analyze
```

### Programmatic Usage

```javascript
import { processLogFile } from 'aojs/log-analyzer';

const analysis = await processLogFile('/var/log/nginx/access.log');
console.log(analysis);
// {
//   total: 1000,
//   mobile: 250,
//   bots: 450,
//   botCategories: {
//     'ai_llm': 50,
//     'search_engines': 200,
//     'seo_marketing': 100,
//     ...
//   },
//   browsers: {...},
//   operatingSystems: {...}
// }
```

### Parse Individual Log Lines

```javascript
import { parseLogLine } from 'aojs/log-analyzer';

const line = '192.168.1.1 - - [14/Sep/2024:09:30:15 +0000] "GET / HTTP/1.1" 200 1234 "-" "Googlebot/2.1"';
const parsed = parseLogLine(line);
// {
//   ip: '192.168.1.1',
//   timestamp: Date,
//   method: 'GET',
//   path: '/',
//   status: 200,
//   userAgent: 'Googlebot/2.1'
// }
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- GNU Make

### Setup

```bash
# Clone the repository
git clone https://github.com/jwalsh/aojs.git
cd aojs

# Install dependencies
make install

# Build the project
make build

# Run tests
make test

# Run all (clean, install, build, test)
make
```

### Available Make Commands

```bash
make install    # Install dependencies
make build      # Build the project
make test       # Run tests
make lint       # Run ESLint
make analyze    # Analyze sample logs
make clean      # Clean build artifacts
make help       # Show help
```

### Project Structure

```
aojs/
├── src/                  # Source code
│   ├── index.js         # Main library
│   └── log-analyzer.js  # Log analysis tool
├── test/                # Test files
│   ├── index.test.js
│   └── log-analyzer.test.js
├── data/                # Sample data
│   └── sample_access.log
├── dist/                # Built files (generated)
├── Makefile            # Build automation
├── package.json        # Package configuration
└── README.md          # Documentation
```

## Examples

### Browser Usage

```javascript
import ao from 'ao';

// Automatically uses window.navigator.userAgent
if (ao.isMobile()) {
  console.log('Mobile device detected');
}

if (ao.isBot()) {
  console.log('Bot detected - might be a crawler');
}

const info = ao.analyze();
console.log(`Browser: ${info.browser.name} ${info.browser.version}`);
console.log(`OS: ${info.os.name} ${info.os.version}`);
```

### Server-Side Bot Detection

```javascript
import express from 'express';
import ao from 'ao';

const app = express();

app.use((req, res, next) => {
  const ua = req.headers['user-agent'];
  const botInfo = ao.detectBotCategory(ua);

  if (botInfo.isBot) {
    console.log(`Bot detected: ${botInfo.primaryCategory}`);

    // Handle AI bots differently
    if (botInfo.primaryCategory === 'ai_llm') {
      res.setHeader('X-Robots-Tag', 'noai');
    }
  }

  next();
});
```

### Log Analysis Script

```javascript
import { processLogFile, generateReport } from 'aojs/log-analyzer';

async function analyzeMyLogs() {
  const analysis = await processLogFile('/var/log/nginx/access.log');

  // Get detailed bot breakdown
  console.log('Bot Categories:', analysis.botCategories);

  // Check AI bot traffic
  const aiTraffic = analysis.botCategories.ai_llm || 0;
  console.log(`AI Bot Requests: ${aiTraffic}`);

  // Generate report
  const report = generateReport(analysis);
  console.log(report);
}

analyzeMyLogs();
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Running Tests

```bash
# Run all tests
make test

# Run specific test file
node --test test/index.test.js

# Run with coverage (if c8 is installed)
npx c8 node --test test/
```

## License

MIT License - see the [LICENSE-MIT](LICENSE-MIT) file for details.

## Author

jwalsh

## Acknowledgments

- User agent patterns based on industry standards
- Bot detection enhanced with contemporary AI/LLM crawler patterns
- Log analysis format compatible with Apache/Nginx Combined Log Format