import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { assessCompliance, getAttestationTier, getAttestation, getComplianceMatrix, isCompliant, COMPLIANCE_REQUIREMENTS, ATTESTATION_TIERS, BOT_COMPLIANCE, TOKEN_PAIRS, OPT_OUT_STANDARDS } from '../dist/compliance.js';

describe('Compliance Module', () => {
  describe('assessCompliance', () => {
    test('identifies Walsh-Research', () => {
      const r = assessCompliance('Mozilla/5.0 (compatible; Walsh-Research/1.1; +https://wal.sh/bot/)');
      assert.strictEqual(r.name, 'Walsh-Research');
      assert.strictEqual(r.tier, 3);
      assert.strictEqual(r.data_usage, 'research');
    });

    test('identifies Walsh-Research v1.2', () => {
      const r = assessCompliance('Mozilla/5.0 (compatible; Walsh-Research/1.2; +https://wal.sh/bot/)');
      assert.strictEqual(r.name, 'Walsh-Research');
      assert.strictEqual(r.spec_url, 'https://wal.sh/research/bots/compliance-spec');
    });

    test('identifies GPTBot', () => {
      const r = assessCompliance('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)');
      assert.strictEqual(r.name, 'GPTBot');
      assert.strictEqual(r.data_usage, 'training');
    });

    test('identifies OAI-SearchBot', () => {
      const r = assessCompliance('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot');
      assert.strictEqual(r.name, 'OAI-SearchBot');
      assert.strictEqual(r.data_usage, 'search');
    });

    test('identifies ChatGPT-User', () => {
      const r = assessCompliance('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot');
      assert.strictEqual(r.name, 'ChatGPT-User');
      assert.strictEqual(r.data_usage, 'search');
    });

    test('identifies ClaudeBot', () => {
      const r = assessCompliance('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)');
      assert.strictEqual(r.name, 'ClaudeBot');
      assert.strictEqual(r.operator, 'Anthropic');
      assert.strictEqual(r.data_usage, 'training');
    });

    test('identifies Claude-User from claude-code', () => {
      const r = assessCompliance('Claude-User (claude-code/2.1.150; +https://support.anthropic.com/)');
      assert.strictEqual(r.name, 'Claude-User');
      assert.strictEqual(r.data_usage, 'search');
    });

    test('identifies Amazonbot', () => {
      const r = assessCompliance('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)');
      assert.strictEqual(r.name, 'Amazonbot');
      assert.strictEqual(r.compliance.R4, false);
    });

    test('identifies PerplexityBot', () => {
      const r = assessCompliance('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)');
      assert.strictEqual(r.name, 'PerplexityBot');
      assert.strictEqual(r.operator, 'Perplexity AI');
      assert.strictEqual(r.data_usage, 'search');
    });

    test('identifies LinkupBot', () => {
      const r = assessCompliance('LinkupBot/1.0 (LinkupBot for web indexing; https://linkup.so/bot; bot@linkup.so)');
      assert.strictEqual(r.name, 'LinkupBot');
      assert.strictEqual(r.policy_url, 'https://linkup.so/bot');
    });

    test('identifies Bytespider', () => {
      const r = assessCompliance('Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; https://zhanzhang.toutiao.com/)');
      assert.strictEqual(r.name, 'Bytespider');
      assert.strictEqual(r.operator, 'ByteDance');
      assert.strictEqual(r.tier, 1);
    });

    test('identifies meta-externalagent', () => {
      const r = assessCompliance('meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)');
      assert.strictEqual(r.name, 'Meta-ExternalAgent');
      assert.strictEqual(r.operator, 'Meta');
    });

    test('identifies DuckAssistBot', () => {
      const r = assessCompliance('DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)');
      assert.strictEqual(r.name, 'DuckAssistBot');
      assert.strictEqual(r.operator, 'DuckDuckGo');
    });

    test('identifies PetalBot', () => {
      const r = assessCompliance('Mozilla/5.0 (Linux; Android 7.0;) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)');
      assert.strictEqual(r.name, 'PetalBot');
      assert.strictEqual(r.operator, 'Huawei (Petal Search)');
    });

    test('identifies LinerBot (tier 1, no policy)', () => {
      const r = assessCompliance('LinerBot');
      assert.strictEqual(r.name, 'LinerBot');
      assert.strictEqual(r.tier, 1);
      assert.strictEqual(r.policy_url, null);
    });

    test('returns null for unknown user agent', () => {
      assert.strictEqual(assessCompliance('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), null);
    });

    test('returns null for empty input', () => {
      assert.strictEqual(assessCompliance(''), null);
      assert.strictEqual(assessCompliance(null), null);
    });
  });

  describe('getAttestationTier', () => {
    test('Walsh-Research is tier 3', () => {
      const t = getAttestationTier('Mozilla/5.0 (compatible; Walsh-Research/1.1; +https://wal.sh/bot/)');
      assert.strictEqual(t.tier, 3);
      assert.strictEqual(t.name, 'Verifiable contract');
    });

    test('GPTBot is tier 2', () => {
      const t = getAttestationTier('GPTBot/1.4');
      assert.strictEqual(t.tier, 2);
      assert.strictEqual(t.name, 'UA + policy URL');
    });

    test('Bytespider is tier 1', () => {
      const t = getAttestationTier('Bytespider');
      assert.strictEqual(t.tier, 1);
      assert.strictEqual(t.name, 'UA assertion only');
    });

    test('unknown UA is tier 0', () => {
      const t = getAttestationTier('curl/7.88.0');
      assert.strictEqual(t.tier, 0);
      assert.strictEqual(t.name, 'Undeclared');
    });
  });

  describe('getAttestation', () => {
    test('Walsh-Research returns full attestation', () => {
      const att = getAttestation('Mozilla/5.0 (compatible; Walsh-Research/1.2; +https://wal.sh/bot/)');
      assert.strictEqual(att.identity, 'Walsh-Research (Jason Walsh)');
      assert.strictEqual(att.policy_url, 'https://wal.sh/bot/');
      assert.strictEqual(att.spec_url, 'https://wal.sh/research/bots/compliance-spec');
      assert.strictEqual(att.tier, 3);
      assert.strictEqual(att.data_usage, 'research');
      assert.strictEqual(att.compliant, true);
      assert.strictEqual(att.failures.length, 0);
      assert.strictEqual(att.claims.length, 13); // all R1-R13 fulfilled
      assert.ok(att.opt_out_honored.includes('robots.txt'));
      assert.ok(att.opt_out_honored.includes('blocklist'));
    });

    test('GPTBot shows unverified obligations', () => {
      const att = getAttestation('GPTBot/1.4');
      assert.strictEqual(att.identity, 'GPTBot (OpenAI)');
      assert.strictEqual(att.tier, 2);
      assert.strictEqual(att.data_usage, 'training');
      assert.strictEqual(att.compliant, true); // no confirmed failures
      assert.ok(att.claims.length >= 2); // R1, R2 fulfilled
      assert.ok(att.obligations.length > 0); // unverified MUSTs
      assert.ok(att.obligations.some(o => o.includes('unverified')));
    });

    test('Amazonbot shows R4 failure', () => {
      const att = getAttestation('Amazonbot/0.1');
      assert.strictEqual(att.compliant, false);
      assert.ok(att.failures.length > 0);
      assert.ok(att.failures.some(f => f.includes('R4')));
    });

    test('unknown bot returns non-compliant with R1 obligation', () => {
      const att = getAttestation('RandomScraper/1.0');
      assert.strictEqual(att.compliant, false);
      assert.ok(att.obligations.some(o => o.includes('R1')));
      assert.strictEqual(att.tier_description, 'No identifying UA, no policy URL');
    });

    test('null input returns non-compliant', () => {
      const att = getAttestation(null);
      assert.strictEqual(att.compliant, false);
      assert.strictEqual(att.identity, 'unknown');
    });

    test('Bytespider shows partial R1 failure', () => {
      const att = getAttestation('Bytespider');
      assert.strictEqual(att.compliant, false);
      assert.ok(att.failures.some(f => f.includes('R1') && f.includes('partial')));
    });

    test('LinerBot is non-compliant', () => {
      const att = getAttestation('LinerBot');
      assert.strictEqual(att.compliant, false);
      assert.strictEqual(att.tier, 1);
      assert.strictEqual(att.policy_url, null);
    });
  });

  describe('isCompliant', () => {
    test('Walsh-Research R1 is true', () => {
      assert.strictEqual(isCompliant('Mozilla/5.0 (compatible; Walsh-Research/1.1; +https://wal.sh/bot/)', 'R1'), true);
    });

    test('Walsh-Research all MUST requirements are true', () => {
      const ua = 'Walsh-Research/1.0';
      for (const id of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R10', 'R12']) {
        assert.strictEqual(isCompliant(ua, id), true, `${id} should be true`);
      }
    });

    test('Walsh-Research all SHOULD requirements are true', () => {
      const ua = 'Walsh-Research/1.0';
      for (const id of ['R7', 'R8', 'R9', 'R11']) {
        assert.strictEqual(isCompliant(ua, id), true, `${id} should be true`);
      }
    });

    test('Amazonbot R4 is false', () => {
      assert.strictEqual(isCompliant('Amazonbot/0.1', 'R4'), false);
    });

    test('GPTBot R3 is unknown', () => {
      assert.strictEqual(isCompliant('GPTBot/1.0', 'R3'), 'unknown');
    });

    test('unknown bot returns null', () => {
      assert.strictEqual(isCompliant('SomeRandomBot/1.0', 'R1'), null);
    });
  });

  describe('getComplianceMatrix', () => {
    test('returns array of all profiles', () => {
      const matrix = getComplianceMatrix();
      assert.ok(Array.isArray(matrix));
      assert.ok(matrix.length >= 20); // updated count with new bots
      assert.ok(matrix.some(p => p.name === 'Walsh-Research'));
      assert.ok(matrix.some(p => p.name === 'GPTBot'));
      assert.ok(matrix.some(p => p.name === 'PerplexityBot'));
      assert.ok(matrix.some(p => p.name === 'LinkupBot'));
    });

    test('all profiles have consistent structure', () => {
      const matrix = getComplianceMatrix();
      for (const profile of matrix) {
        assert.ok(profile.name, `profile missing name`);
        assert.ok(profile.category, `${profile.name} missing category`);
        assert.ok(typeof profile.tier === 'number', `${profile.name} tier must be number`);
        assert.ok(profile.tier >= 0 && profile.tier <= 4, `${profile.name} tier must be 0-4`);
      }
    });
  });

  describe('TOKEN_PAIRS', () => {
    test('all operators have training and search tokens', () => {
      for (const [operator, tokens] of Object.entries(TOKEN_PAIRS)) {
        assert.ok(tokens.training, `${operator} missing training token`);
        assert.ok(Array.isArray(tokens.search), `${operator} search must be array`);
        assert.ok(tokens.search.length > 0, `${operator} must have at least one search token`);
      }
    });

    test('training tokens map to known bot profiles or are documented', () => {
      // Some training tokens (Applebot-Extended, meta-externalagent) use different
      // casing or names in BOT_COMPLIANCE. Verify the ones we have match.
      const knownMappings = {
        'GPTBot': 'GPTBot',
        'ClaudeBot': 'ClaudeBot',
        'Google-Extended': 'Google-Extended',
        'Amazonbot': 'Amazonbot',
      };
      for (const [token, profileName] of Object.entries(knownMappings)) {
        const profile = BOT_COMPLIANCE[profileName];
        assert.ok(profile, `${token} not in BOT_COMPLIANCE`);
        assert.strictEqual(profile.data_usage, 'training', `${token} should be training usage`);
      }
    });
  });

  describe('OPT_OUT_STANDARDS', () => {
    test('all standards have required fields', () => {
      for (const [id, standard] of Object.entries(OPT_OUT_STANDARDS)) {
        assert.ok(standard.id, `${id} missing id`);
        assert.ok(standard.spec, `${id} missing spec`);
        assert.ok(standard.description, `${id} missing description`);
      }
    });

    test('robots.txt is universal adoption', () => {
      assert.strictEqual(OPT_OUT_STANDARDS['robots.txt'].adoption, 'universal');
    });
  });

  describe('COMPLIANCE_REQUIREMENTS', () => {
    test('all 12 requirements exist', () => {
      for (let i = 1; i <= 12; i++) {
        const id = `R${i}`;
        assert.ok(COMPLIANCE_REQUIREMENTS[id], `${id} missing`);
      }
    });

    test('all requirements have required fields', () => {
      for (const [id, req] of Object.entries(COMPLIANCE_REQUIREMENTS)) {
        assert.ok(req.id, `${id} missing id`);
        assert.ok(req.level === 'MUST' || req.level === 'SHOULD', `${id} level must be MUST or SHOULD`);
        assert.ok(req.name, `${id} missing name`);
        assert.ok(req.description, `${id} missing description`);
      }
    });

    test('MUST requirements are R1-R6, R10, R12', () => {
      const musts = Object.entries(COMPLIANCE_REQUIREMENTS)
        .filter(([, r]) => r.level === 'MUST')
        .map(([id]) => id);
      assert.deepStrictEqual(musts.sort(), ['R1', 'R10', 'R12', 'R2', 'R3', 'R4', 'R5', 'R6']);
    });

    test('SHOULD requirements are R7-R9, R11, R13', () => {
      const shoulds = Object.entries(COMPLIANCE_REQUIREMENTS)
        .filter(([, r]) => r.level === 'SHOULD')
        .map(([id]) => id);
      assert.deepStrictEqual(shoulds.sort(), ['R11', 'R13', 'R7', 'R8', 'R9']);
    });
  });

  describe('ATTESTATION_TIERS', () => {
    test('all 5 tiers exist (0-4)', () => {
      for (let i = 0; i <= 4; i++) {
        assert.ok(ATTESTATION_TIERS[i], `tier ${i} missing`);
        assert.strictEqual(ATTESTATION_TIERS[i].tier, i);
        assert.ok(ATTESTATION_TIERS[i].name);
        assert.ok(ATTESTATION_TIERS[i].description);
      }
    });
  });

  describe('data integrity', () => {
    test('all requirements have required fields', () => {
      for (const [id, req] of Object.entries(COMPLIANCE_REQUIREMENTS)) {
        assert.ok(req.id, `${id} missing id`);
        assert.ok(req.level, `${id} missing level`);
        assert.ok(req.name, `${id} missing name`);
      }
    });

    test('all bot profiles have required fields', () => {
      for (const [name, profile] of Object.entries(BOT_COMPLIANCE)) {
        assert.ok(profile.category, `${name} missing category`);
        assert.ok(profile.operator, `${name} missing operator`);
        assert.ok(profile.robots_token, `${name} missing robots_token`);
        assert.ok(typeof profile.tier === 'number', `${name} missing tier`);
        assert.ok(profile.data_usage, `${name} missing data_usage`);
        assert.ok(profile.compliance, `${name} missing compliance`);
      }
    });

    test('all bot profiles have R1 compliance status', () => {
      for (const [name, profile] of Object.entries(BOT_COMPLIANCE)) {
        assert.ok(profile.compliance.R1 !== undefined, `${name} missing R1 compliance`);
      }
    });

    test('tier 3+ bots have spec_url or all MUST requirements met', () => {
      for (const [name, profile] of Object.entries(BOT_COMPLIANCE)) {
        if (profile.tier >= 3) {
          const mustReqs = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R10', 'R12'];
          for (const req of mustReqs) {
            assert.strictEqual(profile.compliance[req], true, `Tier 3 bot ${name} should have ${req} = true`);
          }
        }
      }
    });

    test('bots with policy_url are at least tier 2', () => {
      for (const [name, profile] of Object.entries(BOT_COMPLIANCE)) {
        if (profile.policy_url) {
          assert.ok(profile.tier >= 2, `${name} has policy_url but tier < 2`);
        }
      }
    });
  });
});
