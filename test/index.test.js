import { describe, it, test } from 'node:test';
import assert from 'node:assert';
import ao, { detectBotCategory } from '../dist/index.js';

describe('aojs - Device Detection', () => {
  describe('Mobile Detection', () => {
    it('should detect iPhone', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15';
      assert.strictEqual(ao.isMobile(ua), true);
    });

    it('should detect Android', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36';
      assert.strictEqual(ao.isMobile(ua), true);
    });

    it('should detect iPad', () => {
      const ua = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15';
      assert.strictEqual(ao.isMobile(ua), true);
    });

    it('should not detect desktop as mobile', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      assert.strictEqual(ao.isMobile(ua), false);
    });
  });

  describe('Bot Detection', () => {
    it('should detect Googlebot', () => {
      const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      assert.strictEqual(ao.isBot(ua), true);
    });

    it('should detect Bingbot', () => {
      const ua = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
      assert.strictEqual(ao.isBot(ua), true);
    });

    it('should not detect regular browser as bot', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110';
      assert.strictEqual(ao.isBot(ua), false);
    });
  });

  describe('Browser Detection', () => {
    it('should detect Chrome', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/96.0.4664.110';
      const browser = ao.detectBrowser(ua);
      assert.strictEqual(browser.name, 'chrome');
      assert.strictEqual(browser.version, '96');
    });

    it('should detect Firefox', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0';
      const browser = ao.detectBrowser(ua);
      assert.strictEqual(browser.name, 'firefox');
      assert.strictEqual(browser.version, '95');
    });

    it('should detect Safari', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_1) AppleWebKit/605.1.15 Safari/605.1.15';
      const browser = ao.detectBrowser(ua);
      assert.strictEqual(browser.name, 'safari');
      assert.strictEqual(browser.version, '605');
    });

    it('should detect Edge', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/96.0.1054.62';
      const browser = ao.detectBrowser(ua);
      assert.strictEqual(browser.name, 'edge');
      assert.strictEqual(browser.version, '96');
    });
  });

  describe('OS Detection', () => {
    it('should detect Windows', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110';
      const os = ao.detectOS(ua);
      assert.strictEqual(os.name, 'windows');
      assert.strictEqual(os.version, '10.0');
    });

    it('should detect macOS', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_1) Safari/605.1.15';
      const os = ao.detectOS(ua);
      assert.strictEqual(os.name, 'macos');
      assert.strictEqual(os.version, '12_1');
    });

    it('should detect Android', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 11; Pixel 5) Chrome/96.0.4664.110';
      const os = ao.detectOS(ua);
      assert.strictEqual(os.name, 'android');
      assert.strictEqual(os.version, '11');
    });

    it('should detect iOS', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) Safari/604.1';
      const os = ao.detectOS(ua);
      assert.strictEqual(os.name, 'ios');
      assert.strictEqual(os.version, '15_2');
    });

    it('should detect Linux', () => {
      const ua = 'Mozilla/5.0 (X11; Linux x86_64) Firefox/95.0';
      const os = ao.detectOS(ua);
      assert.strictEqual(os.name, 'linux');
      assert.strictEqual(os.version, null);
    });
  });

  describe('Bot Category Detection', () => {
    it('should detect AI/LLM bots', () => {
      const ua = 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)';
      const botInfo = ao.detectBotCategory(ua);

      assert.strictEqual(botInfo.isBot, true);
      assert.strictEqual(botInfo.primaryCategory, 'ai_llm');
      assert(botInfo.categories.includes('ai_llm'));
    });

    it('should detect search engine bots', () => {
      const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const botInfo = ao.detectBotCategory(ua);

      assert.strictEqual(botInfo.isBot, true);
      assert.strictEqual(botInfo.primaryCategory, 'search_engines');
    });

    it('should detect SEO/marketing bots', () => {
      const ua = 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)';
      const botInfo = ao.detectBotCategory(ua);

      assert.strictEqual(botInfo.isBot, true);
      assert.strictEqual(botInfo.primaryCategory, 'seo_marketing');
    });

    it('should detect social media bots', () => {
      const ua = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
      const botInfo = ao.detectBotCategory(ua);

      assert.strictEqual(botInfo.isBot, true);
      assert(botInfo.categories.includes('social_media'));
    });

    it('should detect monitoring bots', () => {
      const ua = 'UptimeRobot/2.0 (http://www.uptimerobot.com/)';
      const botInfo = ao.detectBotCategory(ua);

      assert.strictEqual(botInfo.isBot, true);
      assert.strictEqual(botInfo.primaryCategory, 'monitoring');
    });

    it('should detect multiple categories', () => {
      const ua = 'Mozilla/5.0 (compatible; facebookexternalhit/1.1; Googlebot/2.1)';
      const botInfo = ao.detectBotCategory(ua);

      assert.strictEqual(botInfo.isBot, true);
      assert(botInfo.categories.length >= 2);
      assert(botInfo.categories.includes('search_engines'));
      assert(botInfo.categories.includes('social_media'));
    });

    it('should return empty for non-bot user agents', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110';
      const botInfo = ao.detectBotCategory(ua);

      assert.strictEqual(botInfo.isBot, false);
      assert.strictEqual(botInfo.primaryCategory, null);
      assert.strictEqual(botInfo.categories.length, 0);
    });
  });

  describe('Complete Analysis', () => {
    it('should provide complete analysis', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) Safari/604.1';
      const analysis = ao.analyze(ua);

      assert.strictEqual(analysis.userAgent, ua);
      assert.strictEqual(analysis.isMobile, true);
      assert.strictEqual(analysis.isBot, false);
      assert.strictEqual(analysis.botCategory, null);
      assert.strictEqual(analysis.botCategories.length, 0);
      assert.strictEqual(analysis.browser.name, 'safari');
      assert.strictEqual(analysis.os.name, 'ios');
      assert(analysis.timestamp);
    });

    it('should analyze bot user agent with categories', () => {
      const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      const analysis = ao.analyze(ua);

      assert.strictEqual(analysis.isBot, true);
      assert.strictEqual(analysis.isMobile, false);
      assert.strictEqual(analysis.botCategory, 'search_engines');
      assert(analysis.botCategories.includes('search_engines'));
    });

    it('should analyze AI bot user agent', () => {
      const ua = 'GPTBot/1.0 (+https://openai.com/gptbot)';
      const analysis = ao.analyze(ua);

      assert.strictEqual(analysis.isBot, true);
      assert.strictEqual(analysis.botCategory, 'ai_llm');
      assert(analysis.botCategories.includes('ai_llm'));
    });
  });
});

describe('Bot Classification Fixes', () => {
  // Amazonbot should be ai_llm, not ecommerce
  test('classifies Amazonbot as ai_llm', () => {
    const result = detectBotCategory('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)');
    assert.strictEqual(result.primaryCategory, 'ai_llm');
  });

  // Applebot should be search_engines, not social_media
  test('classifies Applebot as search_engines', () => {
    const result = detectBotCategory('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1)');
    assert.strictEqual(result.primaryCategory, 'search_engines');
  });

  // Walsh-Research should be research_crawlers
  test('classifies Walsh-Research as research_crawlers', () => {
    const result = detectBotCategory('Mozilla/5.0 (compatible; Walsh-Research/1.1; +https://wal.sh/bot/)');
    assert.strictEqual(result.primaryCategory, 'research_crawlers');
  });

  // LinkupBot should be ai_llm
  test('classifies LinkupBot as ai_llm', () => {
    const result = detectBotCategory('LinkupBot/1.0 (LinkupBot for web indexing; https://linkup.so/bot)');
    assert.strictEqual(result.primaryCategory, 'ai_llm');
  });

  // Monit should be monitoring
  test('classifies Monit as monitoring', () => {
    const result = detectBotCategory('Monit/5.35.2');
    assert.strictEqual(result.primaryCategory, 'monitoring');
  });

  // DreamHost should be monitoring
  test('classifies DreamHost as monitoring', () => {
    const result = detectBotCategory('DreamHost Data Team (+http://www.dreamhost.com/support/)');
    assert.strictEqual(result.primaryCategory, 'monitoring');
  });
});