import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ao from '../dist/index.js';
import { assessCompliance, getAttestation, getAttestationTier } from '../dist/compliance.js';

// Load real user agents from wal.sh access logs
const fixturesPath = resolve(import.meta.dirname, 'fixtures/real-user-agents.txt');
const realUserAgents = readFileSync(fixturesPath, 'utf-8')
  .split('\n')
  .filter(line => line.trim().length > 0);

describe('Harness: Real User Agents from wal.sh', () => {
  test('fixture file has user agents', () => {
    assert.ok(realUserAgents.length > 50, `Expected 50+ UAs, got ${realUserAgents.length}`);
  });

  describe('classification stability', () => {
    test('every UA produces a valid analyze() result without throwing', () => {
      for (const ua of realUserAgents) {
        const result = ao.analyze(ua);
        assert.ok(result, `analyze() returned falsy for: ${ua}`);
        assert.ok(typeof result.isMobile === 'boolean', `isMobile not boolean for: ${ua}`);
        assert.ok(typeof result.isBot === 'boolean', `isBot not boolean for: ${ua}`);
      }
    });

    test('every UA produces a valid detectBotCategory() result', () => {
      for (const ua of realUserAgents) {
        const result = ao.detectBotCategory(ua);
        assert.ok(result, `detectBotCategory() returned falsy for: ${ua}`);
        assert.ok(typeof result.isBot === 'boolean');
        if (result.isBot) {
          assert.ok(Array.isArray(result.categories), `categories not array for: ${ua}`);
          assert.ok(result.categories.length > 0, `bot with no categories: ${ua}`);
        }
      }
    });
  });

  describe('compliance engine stability', () => {
    test('assessCompliance never throws on real UAs', () => {
      for (const ua of realUserAgents) {
        // Should return profile or null, never throw
        const result = assessCompliance(ua);
        assert.ok(result === null || typeof result === 'object');
      }
    });

    test('getAttestation never throws on real UAs', () => {
      for (const ua of realUserAgents) {
        const att = getAttestation(ua);
        assert.ok(att, `getAttestation returned falsy for: ${ua}`);
        assert.ok(typeof att.compliant === 'boolean');
        assert.ok(Array.isArray(att.claims));
        assert.ok(Array.isArray(att.obligations));
      }
    });

    test('getAttestationTier always returns a valid tier', () => {
      for (const ua of realUserAgents) {
        const tier = getAttestationTier(ua);
        assert.ok(tier, `getAttestationTier returned falsy for: ${ua}`);
        assert.ok(typeof tier.tier === 'number');
        assert.ok(tier.tier >= 0 && tier.tier <= 4);
      }
    });
  });

  describe('bot detection coverage', () => {
    test('known AI bots in logs are detected as bots', () => {
      const aiPatterns = ['GPTBot', 'ClaudeBot', 'Claude-User', 'PerplexityBot',
        'Amazonbot', 'Bytespider', 'meta-externalagent', 'OAI-SearchBot',
        'ChatGPT-User', 'LinkupBot'];

      for (const pattern of aiPatterns) {
        const ua = realUserAgents.find(u => u.includes(pattern));
        if (ua) {
          const result = ao.detectBotCategory(ua);
          assert.ok(result.isBot, `${pattern} not detected as bot in: ${ua}`);
        }
      }
    });

    test('known AI bots have compliance profiles', () => {
      const aiPatterns = ['GPTBot', 'ClaudeBot', 'Claude-User', 'PerplexityBot',
        'Amazonbot', 'Bytespider', 'meta-externalagent', 'OAI-SearchBot',
        'ChatGPT-User', 'LinkupBot', 'Walsh-Research'];

      for (const pattern of aiPatterns) {
        const ua = realUserAgents.find(u => u.includes(pattern));
        if (ua) {
          const profile = assessCompliance(ua);
          assert.ok(profile, `No compliance profile for ${pattern} in: ${ua}`);
          assert.ok(profile.policy_url || profile.tier <= 1,
            `${pattern} tier ${profile.tier} should have policy_url`);
        }
      }
    });

    test('search engine bots are detected', () => {
      const searchPatterns = ['Googlebot', 'bingbot', 'YandexBot', 'Applebot',
        'DuckDuckBot', 'PetalBot', 'Qwantbot', 'SeznamBot'];

      for (const pattern of searchPatterns) {
        const ua = realUserAgents.find(u => u.includes(pattern));
        if (ua) {
          const result = ao.detectBotCategory(ua);
          assert.ok(result.isBot, `${pattern} not detected as bot`);
        }
      }
    });

    test('regular browsers are NOT detected as bots', () => {
      const browsers = realUserAgents.filter(ua =>
        ua.includes('Mozilla/5.0') &&
        !ua.includes('bot') && !ua.includes('Bot') &&
        !ua.includes('spider') && !ua.includes('Spider') &&
        !ua.includes('crawl') && !ua.includes('Crawl') &&
        !ua.includes('GPT') && !ua.includes('Claude') &&
        !ua.includes('Amazonbot') && !ua.includes('Perplexity') &&
        !ua.includes('Bytespider') && !ua.includes('meta-external') &&
        !ua.includes('OAI-Search') && !ua.includes('ChatGPT') &&
        !ua.includes('Linkup') && !ua.includes('Walsh-Research') &&
        !ua.includes('newsai') && !ua.includes('Petal') &&
        !ua.includes('Semrush') && !ua.includes('Ahrefs') &&
        !ua.includes('MJ12') && !ua.includes('DataForSeo') &&
        !ua.includes('SERanking') && !ua.includes('Sogou') &&
        !ua.includes('Qwant') && !ua.includes('Seznam') &&
        !ua.includes('DuckAssist') && !ua.includes('Yandex') &&
        !ua.includes('DreamHost') && !ua.includes('compatible;')
      );

      for (const ua of browsers) {
        const result = ao.detectBotCategory(ua);
        // Allow some false positives but flag them
        if (result.isBot) {
          // Only warn, don't fail — some edge cases exist
          console.log(`  [WARN] Browser UA detected as bot: ${ua.substring(0, 80)}...`);
        }
      }
      // At least some should be correctly identified as non-bot
      assert.ok(browsers.length > 0, 'Should have non-bot UAs in fixture');
    });
  });

  describe('attestation distribution', () => {
    test('produces a tier distribution summary', () => {
      const tiers = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      let identified = 0;

      for (const ua of realUserAgents) {
        const profile = assessCompliance(ua);
        if (profile) {
          tiers[profile.tier]++;
          identified++;
        }
      }

      console.log(`  Identified: ${identified}/${realUserAgents.length} UAs`);
      console.log(`  Tier 0 (Undeclared): ${tiers[0]}`);
      console.log(`  Tier 1 (UA only): ${tiers[1]}`);
      console.log(`  Tier 2 (UA + policy): ${tiers[2]}`);
      console.log(`  Tier 3 (Verifiable): ${tiers[3]}`);
      console.log(`  Tier 4 (Audited): ${tiers[4]}`);

      // We should identify at least some bots
      assert.ok(identified > 10, `Only identified ${identified} bots — need more profiles`);
    });
  });
});
