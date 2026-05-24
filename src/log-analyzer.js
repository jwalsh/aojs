/**
 * Log Analyzer for aojs
 * Parses access logs and analyzes user agent patterns
 */

import fs from 'fs/promises';
import ao from './index.js';

/**
 * Parses a single access log line
 * @param {string} line - Apache/Nginx access log line
 * @returns {Object|null} Parsed log entry
 */
export function parseLogLine(line) {
  // Common Log Format (CLF) and Combined Log Format regex
  // Format: IP - - [timestamp] "method path protocol" status size "referer" "user-agent"
  const logRegex = /^(\S+) \S+ \S+ \[([^\]]+)\] "([^"]*)" (\d+) (\S+) "([^"]*)" "([^"]*)"/;

  const match = line.match(logRegex);
  if (!match) return null;

  const [, ip, timestamp, request, status, size, referer, userAgent] = match;
  const [method, path, protocol] = request.split(' ');

  return {
    ip,
    timestamp: new Date(timestamp.replace(':', ' ')),
    method,
    path,
    protocol,
    status: parseInt(status),
    size: size === '-' ? 0 : parseInt(size),
    referer: referer === '-' ? null : referer,
    userAgent: userAgent === '-' ? null : userAgent
  };
}

/**
 * Analyzes user agents from log entries
 * @param {Array} logEntries - Array of parsed log entries
 * @returns {Object} Analysis results
 */
export function analyzeUserAgents(logEntries) {
  const analysis = {
    total: logEntries.length,
    mobile: 0,
    bots: 0,
    botCategories: {},
    browsers: {},
    operatingSystems: {},
    uniqueUserAgents: new Set(),
    topUserAgents: {},
    detailedAnalysis: []
  };

  logEntries.forEach(entry => {
    if (!entry.userAgent) return;

    const ua = entry.userAgent;
    analysis.uniqueUserAgents.add(ua);

    // Count occurrences
    analysis.topUserAgents[ua] = (analysis.topUserAgents[ua] || 0) + 1;

    // Analyze with aojs
    const aoAnalysis = ao.analyze(ua);

    if (aoAnalysis.isMobile) analysis.mobile++;
    if (aoAnalysis.isBot) {
      analysis.bots++;

      // Count bot categories
      if (aoAnalysis.botCategory) {
        analysis.botCategories[aoAnalysis.botCategory] = (analysis.botCategories[aoAnalysis.botCategory] || 0) + 1;
      }
    }

    // Count browsers
    const browserKey = `${aoAnalysis.browser.name} ${aoAnalysis.browser.version || 'unknown'}`;
    analysis.browsers[browserKey] = (analysis.browsers[browserKey] || 0) + 1;

    // Count operating systems
    const osKey = `${aoAnalysis.os.name} ${aoAnalysis.os.version || 'unknown'}`;
    analysis.operatingSystems[osKey] = (analysis.operatingSystems[osKey] || 0) + 1;

    analysis.detailedAnalysis.push({
      ip: entry.ip,
      timestamp: entry.timestamp,
      path: entry.path,
      userAgent: ua,
      analysis: aoAnalysis
    });
  });

  // Convert Set to number
  analysis.uniqueUserAgents = analysis.uniqueUserAgents.size;

  // Sort top user agents by count
  analysis.topUserAgents = Object.entries(analysis.topUserAgents)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [ua, count]) => ({ ...obj, [ua]: count }), {});

  // Calculate percentages
  analysis.mobilePercentage = ((analysis.mobile / analysis.total) * 100).toFixed(2);
  analysis.botPercentage = ((analysis.bots / analysis.total) * 100).toFixed(2);

  return analysis;
}

/**
 * Processes an access log file
 * @param {string} filePath - Path to the access log file
 * @returns {Object} Analysis results
 */
export async function processLogFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    console.log(`Processing ${lines.length} log entries...`);

    const logEntries = lines
      .map(parseLogLine)
      .filter(entry => entry !== null);

    console.log(`Successfully parsed ${logEntries.length} log entries`);

    return analyzeUserAgents(logEntries);
  } catch (error) {
    throw new Error(`Error processing log file: ${error.message}`);
  }
}

/**
 * Generates a summary report
 * @param {Object} analysis - Analysis results
 * @returns {string} Formatted report
 */
export function generateReport(analysis) {
  const report = `
# Access Log Analysis Report

## Summary
- Total Requests: ${analysis.total}
- Unique User Agents: ${analysis.uniqueUserAgents}
- Mobile Requests: ${analysis.mobile} (${analysis.mobilePercentage}%)
- Bot Requests: ${analysis.bots} (${analysis.botPercentage}%)

## Top User Agents
${Object.entries(analysis.topUserAgents)
    .map(([ua, count]) => `- ${count}x: ${ua}`)
    .join('\n')}

## Browser Distribution
${Object.entries(analysis.browsers)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([browser, count]) => `- ${browser}: ${count}`)
    .join('\n')}

## Bot Categories
${Object.entries(analysis.botCategories)
    .sort(([,a], [,b]) => b - a)
    .map(([category, count]) => `- ${category.replace('_', ' ')}: ${count}`)
    .join('\n')}

## Operating System Distribution
${Object.entries(analysis.operatingSystems)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([os, count]) => `- ${os}: ${count}`)
    .join('\n')}
`;

  return report.trim();
}

// CLI usage
if (process.argv[2]) {
  const logFile = process.argv[2];
  processLogFile(logFile)
    .then(analysis => {
      console.log(generateReport(analysis));
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
