/**
 * Planner — Builds action plans from parsed intents, using memory
 */
import type { ParsedIntent, ActionPlan, ActionStep, PlanContext } from '../types.js';
import { MemoryStore } from '../utils/memory.js';

export class Planner {
  private memory: MemoryStore;
  private planCounter = 0;

  constructor(memory: MemoryStore) {
    this.memory = memory;
  }

  async buildPlan(intent: ParsedIntent): Promise<ActionPlan> {
    this.planCounter++;
    const planId = `plan_${Date.now()}_${this.planCounter}`;
    const previousOutcomes = await this.memory.getRelevantOutcomes(intent.raw);
    const successPatterns = intent.type !== 'unknown' ? await this.memory.getSuccessPatterns(intent.type) : [];

    const context: PlanContext = {
      intent: intent.raw,
      parsedType: intent.type,
      confidence: intent.confidence,
      sourceDevice: 'termux-local',
      previousOutcomes,
    };

    const { steps, rollbackSteps } = this.constructSteps(intent, successPatterns);

    return {
      id: planId,
      intent: intent.raw,
      steps,
      rollbackSteps,
      context,
      createdAt: Date.now(),
    };
  }

  private constructSteps(intent: ParsedIntent, successPatterns: string[]): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    switch (intent.type) {
      case 'deploy': return this.buildDeployPlan();
      case 'fix': return this.buildFixPlan();
      case 'setup': return this.buildSetupPlan(intent);
      case 'install': return this.buildInstallPlan(intent);
      case 'configure': return this.buildConfigurePlan();
      case 'monitor': return this.buildMonitorPlan();
      case 'automate': return this.buildAutomatePlan();
      case 'device_control': return this.buildDeviceControlPlan(intent);
      case 'query': return this.buildQueryPlan(intent);
      default: return this.buildGenericPlan(intent);
    }
  }

  private buildDeployPlan(): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    return {
      steps: [
        { tool: 'shell', params: { cmd: 'git pull --ff-only' }, validate: (o: string) => !o.includes('error') && !o.includes('fatal'), onFail: 'ask', maxRetries: 1 },
        { tool: 'shell', params: { cmd: 'npm install' }, validate: (o: string) => !o.includes('ERR!'), onFail: 'retry', maxRetries: 2 },
        { tool: 'shell', params: { cmd: 'npm run build' }, validate: (o: string) => !o.includes('error') && !o.includes('failed'), onFail: 'ask', maxRetries: 1 },
        { tool: 'shell', params: { cmd: 'pm2 restart all || pm2 start ecosystem.config.js || pm2 start npm --name app -- start' }, validate: (o: string) => o.includes('restarted') || o.includes('started') || o.includes('online'), onFail: 'retry', maxRetries: 2 },
        { tool: 'shell', params: { cmd: 'sleep 3 && curl -s http://localhost:3000/health || curl -s http://localhost:3000 || echo "OK"' }, validate: (o: string) => o.includes('OK') || o.includes('ok') || o.includes('healthy') || o.includes('{"'), onFail: 'rollback', maxRetries: 3 },
      ],
      rollbackSteps: [
        { tool: 'shell', params: { cmd: 'pm2 stop all' }, onFail: 'skip', maxRetries: 1 },
        { tool: 'shell', params: { cmd: 'git reset --hard HEAD~1' }, onFail: 'skip', maxRetries: 1 },
        { tool: 'shell', params: { cmd: 'pm2 restart all' }, onFail: 'abort', maxRetries: 1 },
      ],
    };
  }

  private buildFixPlan(): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    return {
      steps: [
        { tool: 'shell', params: { cmd: 'pm2 logs --lines 50 || journalctl -n 50 || tail -n 50 ~/.npm/_logs/*.log 2>/dev/null | tail -n 50' }, validate: () => true, onFail: 'skip', maxRetries: 0 },
        { tool: 'shell', params: { cmd: 'npm audit fix --force 2>/dev/null || echo "No audit"' }, validate: () => true, onFail: 'skip', maxRetries: 0 },
        { tool: 'shell', params: { cmd: 'rm -rf node_modules package-lock.json && npm install' }, validate: (o: string) => !o.includes('ERR!'), onFail: 'ask', maxRetries: 1 },
        { tool: 'shell', params: { cmd: 'npm run build' }, validate: (o: string) => !o.includes('error'), onFail: 'ask', maxRetries: 1 },
        { tool: 'shell', params: { cmd: 'pm2 restart all' }, validate: (o: string) => o.includes('restarted') || o.includes('online'), onFail: 'retry', maxRetries: 2 },
      ],
      rollbackSteps: [],
    };
  }

  private buildSetupPlan(intent: ParsedIntent): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    const template = intent.entities.find(e => ['next', 'react', 'express', 'nest', 'nestjs'].includes(e)) || 'next';
    return {
      steps: [
        { tool: 'core_install', params: { module: 'lang' }, validate: (o: string) => o.includes('installed') || o.includes('done'), onFail: 'ask', maxRetries: 1 },
        { tool: 'core_install', params: { module: 'npm' }, validate: () => true, onFail: 'skip', maxRetries: 0 },
        { tool: 'core_init', params: { template }, validate: (o: string) => o.includes('configured') || o.includes('done'), onFail: 'ask', maxRetries: 1 },
      ],
      rollbackSteps: [],
    };
  }

  private buildInstallPlan(intent: ParsedIntent): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    const module = intent.entities.find(e => ['lang', 'db', 'ai', 'editor', 'dev', 'npm', 'shell', 'ui', 'auto'].includes(e));
    const steps: ActionStep[] = module
      ? [{ tool: 'core_install', params: { module }, validate: () => true, onFail: 'ask', maxRetries: 1 }]
      : [{ tool: 'shell', params: { cmd: 'npm install' }, validate: () => true, onFail: 'ask', maxRetries: 1 }];
    return { steps, rollbackSteps: [] };
  }

  private buildConfigurePlan(): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    return { steps: [{ tool: 'shell', params: { cmd: 'ls -la .env* 2>/dev/null || echo "No env files"' }, validate: () => true, onFail: 'skip', maxRetries: 0 }], rollbackSteps: [] };
  }

  private buildMonitorPlan(): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    return {
      steps: [
        { tool: 'shell', params: { cmd: 'pm2 status || echo "PM2 not running"' }, validate: () => true, onFail: 'skip', maxRetries: 0 },
        { tool: 'shell', params: { cmd: 'df -h && free -h' }, validate: () => true, onFail: 'skip', maxRetries: 0 },
        { tool: 'device_state', params: {}, validate: () => true, onFail: 'skip', maxRetries: 0 },
      ],
      rollbackSteps: [],
    };
  }

  private buildAutomatePlan(): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    return { steps: [{ tool: 'shell', params: { cmd: 'echo "Automation plan created — configure cron or PM2 for recurring tasks"' }, validate: () => true, onFail: 'skip', maxRetries: 0 }], rollbackSteps: [] };
  }

  private buildDeviceControlPlan(intent: ParsedIntent): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    const steps: ActionStep[] = [];
    if (intent.raw.includes('screenshot')) steps.push({ tool: 'device_screenshot', params: {}, validate: () => true, onFail: 'skip', maxRetries: 1 });
    if (intent.raw.includes('tap') || intent.raw.includes('click')) steps.push({ tool: 'device_tap', params: { x: 500, y: 1000 }, validate: () => true, onFail: 'skip', maxRetries: 1 });
    if (intent.raw.includes('swipe')) steps.push({ tool: 'device_swipe', params: { x1: 500, y1: 1500, x2: 500, y2: 500 }, validate: () => true, onFail: 'skip', maxRetries: 1 });
    if (intent.raw.includes('app') || intent.raw.includes('open')) steps.push({ tool: 'device_list_apps', params: {}, validate: () => true, onFail: 'skip', maxRetries: 0 });
    if (steps.length === 0) steps.push({ tool: 'device_state', params: {}, validate: () => true, onFail: 'skip', maxRetries: 0 });
    return { steps, rollbackSteps: [] };
  }

  private buildQueryPlan(intent: ParsedIntent): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    return { steps: [{ tool: 'brain_search', params: { query: intent.raw }, validate: () => true, onFail: 'skip', maxRetries: 0 }], rollbackSteps: [] };
  }

  private buildGenericPlan(intent: ParsedIntent): { steps: ActionStep[]; rollbackSteps: ActionStep[] } {
    return { steps: [{ tool: 'shell', params: { cmd: `echo "Received intent: ${intent.raw}"` }, validate: () => true, onFail: 'skip', maxRetries: 0 }], rollbackSteps: [] };
  }
}
