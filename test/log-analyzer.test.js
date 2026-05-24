import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseLogLine, analyzeUserAgents } from '../dist/log-analyzer.js';

describe('Log Analyzer', () => {
  describe('parseLogLine', () => {
    it('should parse a standard Apache/Nginx log line', () => {
      const line = '192.168.1.100 - - [14/Sep/2024:09:30:15 +0000] "GET / HTTP/1.1" 200 1234 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"';
      const parsed = parseLogLine(line);

      assert.strictEqual(parsed.ip, '192.168.1.100');
      assert.strictEqual(parsed.method, 'GET');
      assert.strictEqual(parsed.path, '/');
      assert.strictEqual(parsed.protocol, 'HTTP/1.1');
      assert.strictEqual(parsed.status, 200);
      assert.strictEqual(parsed.size, 1234);
      assert.strictEqual(parsed.referer, null);
      assert.strictEqual(parsed.userAgent, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    });

    it('should parse log line with referer', () => {
      const line = '192.168.1.101 - - [14/Sep/2024:09:30:16 +0000] "GET /api/status HTTP/1.1" 200 456 "https://example.com/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15"';
      const parsed = parseLogLine(line);

      assert.strictEqual(parsed.ip, '192.168.1.101');
      assert.strictEqual(parsed.path, '/api/status');
      assert.strictEqual(parsed.referer, 'https://example.com/');
    });

    it('should parse bot user agent', () => {
      const line = '66.249.74.123 - - [14/Sep/2024:09:30:18 +0000] "GET /robots.txt HTTP/1.1" 200 234 "-" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"';
      const parsed = parseLogLine(line);

      assert.strictEqual(parsed.ip, '66.249.74.123');
      assert.strictEqual(parsed.userAgent, 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
    });

    it('should return null for invalid log line', () => {
      const line = 'invalid log line format';
      const parsed = parseLogLine(line);

      assert.strictEqual(parsed, null);
    });

    it('should handle size as dash', () => {
      const line = '192.168.1.100 - - [14/Sep/2024:09:30:15 +0000] "GET / HTTP/1.1" 200 - "-" "Mozilla/5.0"';
      const parsed = parseLogLine(line);

      assert.strictEqual(parsed.size, 0);
    });
  });

  describe('analyzeUserAgents', () => {
    const sampleEntries = [
      {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) Safari/604.1',
        path: '/'
      },
      {
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        path: '/robots.txt'
      },
      {
        ip: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110',
        path: '/about'
      },
      {
        ip: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) Safari/604.1',
        path: '/contact'
      }
    ];

    it('should analyze user agents correctly', () => {
      const analysis = analyzeUserAgents(sampleEntries);

      assert.strictEqual(analysis.total, 4);
      assert.strictEqual(analysis.mobile, 2);
      assert.strictEqual(analysis.bots, 1);
      assert.strictEqual(analysis.uniqueUserAgents, 3);
      assert.strictEqual(analysis.mobilePercentage, '50.00');
      assert.strictEqual(analysis.botPercentage, '25.00');
    });

    it('should count top user agents', () => {
      const analysis = analyzeUserAgents(sampleEntries);

      const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) Safari/604.1';
      assert.strictEqual(analysis.topUserAgents[iPhoneUA], 2);
    });

    it('should categorize browsers', () => {
      const analysis = analyzeUserAgents(sampleEntries);

      assert(analysis.browsers['safari 604'] >= 1);
      assert(analysis.browsers['chrome 96'] >= 1);
    });

    it('should categorize operating systems', () => {
      const analysis = analyzeUserAgents(sampleEntries);

      assert(analysis.operatingSystems['ios 15_2'] >= 1);
      assert(analysis.operatingSystems['windows 10.0'] >= 1);
    });

    it('should handle entries without user agents', () => {
      const entriesWithNull = [
        { ip: '192.168.1.100', userAgent: null },
        { ip: '192.168.1.101', userAgent: 'Mozilla/5.0 (iPhone) Safari/604.1' }
      ];

      const analysis = analyzeUserAgents(entriesWithNull);

      assert.strictEqual(analysis.total, 2);
      assert.strictEqual(analysis.uniqueUserAgents, 1);
    });
  });
});
