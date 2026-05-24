import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { assessCompliance, getAttestationTier, getComplianceMatrix, isCompliant, COMPLIANCE_REQUIREMENTS, BOT_COMPLIANCE } from '../dist/compliance.js';

describe('Compliance Module', () => {
  describe('assessCompliance', () => {
    test('identifies Walsh-Research', () => {
      const r = assessCompliance('Mozilla/5.0 (compatible; Walsh-Research/1.1; +https://wal.sh/bot/)');
      assert.strictEqual(r.name, 'Walsh-Research');
      assert.strictEqual(r.tier, 3);
      assert.strictEqual(r.data_usage, 'research');
    });

    test('identifies GPTBot', () => {
      const r = assessCompliance('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)');
      assert.strictEqual(r.name, 'GPTBot');
      assert.strictEqual(r.data_usage, 'training');
    });

    test('identifies Amazonbot', () => {
      const r = assessCompliance('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1)');
      assert.strictEqual(r.name, 'Amazonbot');
      assert.strictEqual(r.compliance.R4, false);
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

    test('unknown UA is tier 0', () => {
      const t = getAttestationTier('curl/7.88.0');
      assert.strictEqual(t.tier, 0);
    });
  });

  describe('isCompliant', () => {
    test('Walsh-Research R1 is true', () => {
      assert.strictEqual(isCompliant('Mozilla/5.0 (compatible; Walsh-Research/1.1; +https://wal.sh/bot/)', 'R1'), true);
    });

    test('Amazonbot R4 is false', () => {
      assert.strictEqual(isCompliant('Amazonbot/0.1', 'R4'), false);
    });

    test('unknown bot returns null', () => {
      assert.strictEqual(isCompliant('SomeRandomBot/1.0', 'R1'), null);
    });
  });

  describe('getComplianceMatrix', () => {
    test('returns array of all profiles', () => {
      const matrix = getComplianceMatrix();
      assert.ok(Array.isArray(matrix));
      assert.ok(matrix.length > 10);
      assert.ok(matrix.some(p => p.name === 'Walsh-Research'));
      assert.ok(matrix.some(p => p.name === 'GPTBot'));
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
  });
});
