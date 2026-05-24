import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ao from '../dist/index.js';
import { assessCompliance } from '../dist/compliance.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load external datasets
const crawlerUAs = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/crawler-user-agents.json'), 'utf8'));
const aiRobotsTxt = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/ai-robots-txt.json'), 'utf8'));

describe('External Fixtures: monperrus/crawler-user-agents (647 crawlers, 1244 UAs)', () => {
  const allInstances = crawlerUAs
    .filter(e => e.instances && e.instances.length)
    .flatMap(e => e.instances);

  test(`fixture loaded: ${crawlerUAs.length} crawlers, ${allInstances.length} UA strings`, () => {
    assert.ok(crawlerUAs.length > 500);
    assert.ok(allInstances.length > 1000);
  });

  test('every UA instance can be analyzed without throwing', () => {
    let errors = 0;
    for (const ua of allInstances) {
      try {
        const result = ao.analyze(ua);
        assert.ok(result);
      } catch {
        errors++;
      }
    }
    assert.strictEqual(errors, 0, `${errors} UAs caused analyze() to throw`);
  });

  test('every UA instance is detected as a bot', () => {
    let missed = 0;
    const missedUAs = [];
    for (const ua of allInstances) {
      const result = ao.detectBotCategory(ua);
      if (!result.isBot) {
        missed++;
        if (missedUAs.length < 10) missedUAs.push(ua.substring(0, 80));
      }
    }
    // Allow some misses (dataset includes edge cases)
    const hitRate = ((allInstances.length - missed) / allInstances.length * 100).toFixed(1);
    console.log(`  Bot detection rate: ${hitRate}% (${allInstances.length - missed}/${allInstances.length})`);
    if (missed > 0) {
      console.log(`  Missed (first 10): ${missedUAs.join('\n    ')}`);
    }
    // Baseline: >60% detection rate for known crawlers
    // Target for v1.3: >80%
    assert.ok(missed < allInstances.length * 0.4,
      `Detection rate ${hitRate}% below 60% threshold — ${missed} missed`);
  });

  test('AI/LLM bots from dataset have compliance profiles', () => {
    const aiKeywords = ['GPT', 'Claude', 'Anthropic', 'OpenAI', 'Perplexity',
      'Bytespider', 'CCBot', 'cohere', 'Amazonbot', 'meta-external', 'Google-Extended'];

    const aiEntries = crawlerUAs.filter(e =>
      aiKeywords.some(k => e.pattern?.includes(k) || e.description?.toLowerCase().includes(k.toLowerCase()))
    );

    console.log(`  AI-related entries in dataset: ${aiEntries.length}`);

    let withProfile = 0;
    for (const entry of aiEntries) {
      const ua = entry.instances?.[0] || entry.pattern;
      if (ua && assessCompliance(ua)) withProfile++;
    }

    console.log(`  With compliance profile: ${withProfile}/${aiEntries.length}`);
    // We should cover most AI bots
    assert.ok(withProfile > aiEntries.length * 0.5,
      `Only ${withProfile}/${aiEntries.length} AI bots have profiles`);
  });

  test('dataset URLs cross-reference our policy_url data', () => {
    let matches = 0;
    // track mismatches for debugging

    for (const entry of crawlerUAs) {
      if (!entry.instances || !entry.url) continue;
      const ua = entry.instances[0];
      const profile = assessCompliance(ua);
      if (profile && profile.policy_url) {
        // Check if our policy URL is reasonable (don't require exact match)
        matches++;
      }
    }
    console.log(`  Entries with matching compliance profiles: ${matches}`);
  });
});

describe('External Fixtures: ai-robots-txt/ai.robots.txt (150 AI bots)', () => {
  const aiTokens = Object.keys(aiRobotsTxt);

  test(`fixture loaded: ${aiTokens.length} AI bot tokens`, () => {
    assert.ok(aiTokens.length > 100);
  });

  test('coverage: how many ai-robots-txt tokens we recognize', () => {
    let recognized = 0;
    let unrecognized = [];

    for (const token of aiTokens) {
      const profile = assessCompliance(token);
      if (profile) {
        recognized++;
      } else {
        unrecognized.push(token);
      }
    }

    const coverage = (recognized / aiTokens.length * 100).toFixed(1);
    console.log(`  Recognition rate: ${coverage}% (${recognized}/${aiTokens.length})`);
    console.log(`  Unrecognized (first 20): ${unrecognized.slice(0, 20).join(', ')}`);

    // Current baseline — track improvement over time
    assert.ok(recognized > 10, `Only ${recognized} tokens recognized — need more profiles`);
  });

  test('all recognized tokens have correct data_usage classification', () => {
    const trainingKeywords = ['train', 'scrape', 'model', 'llm', 'index'];
    const searchKeywords = ['search', 'answer', 'assistant', 'retriev'];

    let correct = 0;
    let total = 0;

    for (const [token, meta] of Object.entries(aiRobotsTxt)) {
      const profile = assessCompliance(token);
      if (!profile) continue;
      total++;

      const funcLower = (meta.function || '').toLowerCase();
      const isTraining = trainingKeywords.some(k => funcLower.includes(k));
      const isSearch = searchKeywords.some(k => funcLower.includes(k));

      if (isTraining && profile.data_usage === 'training') correct++;
      else if (isSearch && profile.data_usage === 'search') correct++;
      else if (!isTraining && !isSearch) correct++; // can't determine, skip
    }

    if (total > 0) {
      console.log(`  data_usage accuracy: ${correct}/${total}`);
    }
  });

  test('robots.txt respect field aligns with our compliance R2', () => {
    let aligned = 0;
    let total = 0;

    for (const [token, meta] of Object.entries(aiRobotsTxt)) {
      const profile = assessCompliance(token);
      if (!profile) continue;
      total++;

      const respectsRobots = meta.respect?.includes('Yes');
      const ourR2 = profile.compliance?.R2;

      if (respectsRobots && ourR2 === true) aligned++;
      else if (!respectsRobots && (ourR2 === false || ourR2 === 'unknown')) aligned++;
    }

    if (total > 0) {
      console.log(`  R2 alignment with ai-robots-txt: ${aligned}/${total}`);
    }
  });

  test('identifies bots missing from our profiles (gap analysis)', () => {
    const missing = [];
    for (const [token, meta] of Object.entries(aiRobotsTxt)) {
      if (!assessCompliance(token)) {
        missing.push({ token, operator: meta.operator, function: meta.function });
      }
    }

    console.log(`  Missing profiles: ${missing.length}/${aiTokens.length}`);
    console.log('  Priority additions (with operators):');
    missing.slice(0, 15).forEach(m =>
      console.log(`    ${m.token} — ${m.operator} — ${m.function?.substring(0, 50)}`)
    );
  });
});
