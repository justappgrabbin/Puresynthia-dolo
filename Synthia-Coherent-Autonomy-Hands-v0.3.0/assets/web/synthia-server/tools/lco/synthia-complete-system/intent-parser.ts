/**
 * Intent Parser — Dimensional: D1=impulse, D2=polarity, D3=witness, D4=context, D5=meaning
 */
import type { ParsedIntent, IntentType } from '../types.js';

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  deploy: ['deploy', 'push', 'ship', 'release', 'publish', 'go live', 'production', 'deploy to', 'push to', 'deploy my', 'deploy the', 'ship it', 'make it live'],
  fix: ['fix', 'repair', 'heal', 'debug', 'troubleshoot', 'broken', 'not working', 'fails', 'error', 'crash', 'bug', 'issue', 'problem', 'resolve', 'solve', 'patch'],
  setup: ['setup', 'install', 'scaffold', 'init', 'initialize', 'configure', 'bootstrap', 'create', 'new project', 'start fresh', 'from scratch'],
  install: ['install', 'add', 'get', 'download', 'pkg', 'package', 'dependency', 'module', 'tool'],
  configure: ['config', 'configure', 'set', 'update', 'change', 'modify', 'env', 'variable', 'setting', 'tweak', 'adjust'],
  monitor: ['monitor', 'check', 'status', 'health', 'logs', 'watch', 'observe', 'track', 'metrics', 'running', 'alive', 'up'],
  automate: ['automate', 'script', 'schedule', 'cron', 'recurring', 'daily', 'workflow', 'pipeline', 'routine', 'auto'],
  device_control: ['tap', 'swipe', 'click', 'screenshot', 'open app', 'close app', 'press', 'device', 'phone', 'screen', 'ui', 'interface', 'button', 'launch', 'terminate'],
  query: ['what', 'how', 'show', 'list', 'get', 'find', 'search', 'lookup', 'tell me', 'info', 'status', 'where', 'when', 'why'],
  unknown: [],
};

const URGENCY_KEYWORDS = {
  critical: ['urgent', 'asap', 'critical', 'down', 'broken', 'emergency', 'now', 'immediately', 'production down', 'server down'],
  high: ['important', 'needed', 'soon', 'quickly', 'fast', 'hurry', 'priority'],
  medium: ['please', 'can you', 'would you', 'when possible'],
  low: ['whenever', 'sometime', 'later', 'no rush', 'eventually'],
};

export class IntentParser {
  parse(input: string): ParsedIntent {
    const lower = input.toLowerCase();
    let bestType: IntentType = 'unknown';
    let bestScore = 0;

    for (const [type, keywords] of Object.entries(INTENT_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score += kw.length;
      }
      if (score > bestScore) {
        bestScore = score;
        bestType = type as IntentType;
      }
    }

    const entities = this.extractEntities(lower);
    let urgency: ParsedIntent['urgency'] = 'medium';
    for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
      if (keywords.some(k => lower.includes(k))) {
        urgency = level as ParsedIntent['urgency'];
        break;
      }
    }

    return {
      type: bestType,
      raw: input,
      entities,
      confidence: bestScore > 0 ? Math.min(bestScore / 20, 1) : 0.1,
      urgency,
    };
  }

  private extractEntities(input: string): string[] {
    const entities: string[] = [];
    const techPattern = /\b(node\.js|nodejs|python|react|next\.js|nextjs|express|nest|nestjs|postgres|postgresql|sqlite|mongodb|redis|docker|nginx|pm2|git|github|vercel|netlify|termux|android)\b/gi;
    let match;
    while ((match = techPattern.exec(input)) !== null) entities.push(match[1].toLowerCase());

    const portPattern = /\b(port\s*)?(\d{2,5})\b/g;
    while ((match = portPattern.exec(input)) !== null) {
      if (parseInt(match[2]) > 1000) entities.push(`port:${match[2]}`);
    }

    const pathPattern = /([~\/][\w\-\/\.]+)/g;
    while ((match = pathPattern.exec(input)) !== null) entities.push(match[1]);

    const pkgPattern = /install\s+(\w+)|["']([^"']+)["']/g;
    while ((match = pkgPattern.exec(input)) !== null) {
      const pkg = match[1] || match[2];
      if (pkg && !entities.includes(pkg)) entities.push(pkg);
    }

    return [...new Set(entities)];
  }
}
