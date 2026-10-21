/**
 * Executor — Runs action plans with retry, rollback, and learning
 */
import type { ActionPlan, ActionStep, ShellResult } from '../types.js';
import { MemoryStore } from '../utils/memory.js';
import { runShell } from '../utils/shell.js';
import { CoreTermuxTools } from '../tools/core-termux.js';
import { DeviceControlTools } from '../tools/device-control.js';

export class Executor {
  private memory: MemoryStore;
  private coreTermux: CoreTermuxTools;
  private deviceControl: DeviceControlTools;
  public onLog?: (msg: string, type: string) => void;

  constructor(memory: MemoryStore) {
    this.memory = memory;
    this.coreTermux = new CoreTermuxTools();
    this.deviceControl = new DeviceControlTools();
  }

  async execute(plan: ActionPlan): Promise<{ success: boolean; output: string; learnings: string[] }> {
    const outputs: string[] = [];
    const learnings: string[] = [];
    let failedStep = -1;
    let errorMessage = '';

    this.log(`Executing plan: ${plan.id} — "${plan.intent}"`, 'info');
    this.log(`${plan.steps.length} steps, ${plan.rollbackSteps.length} rollback steps`, 'info');

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      this.log(`Step ${i + 1}/${plan.steps.length}: ${step.tool}`, 'info');

      const result = await this.executeStep(step);
      outputs.push(`STEP ${i + 1} [${step.tool}]:\n${result.stdout}`);

      if (result.exitCode !== 0) {
        this.log(`Step failed: ${result.stderr}`, 'error');

        if (step.onFail === 'retry' && step.maxRetries > 0) {
          let retrySuccess = false;
          for (let r = 0; r < step.maxRetries; r++) {
            this.log(`Retry ${r + 1}/${step.maxRetries}...`, 'warn');
            await new Promise(res => setTimeout(res, 2000 * (r + 1)));
            const retryResult = await this.executeStep(step);
            if (retryResult.exitCode === 0) {
              outputs.push(`RETRY SUCCESS: ${retryResult.stdout}`);
              learnings.push(`${step.tool} succeeded on retry ${r + 1}`);
              retrySuccess = true;
              break;
            }
          }
          if (!retrySuccess) { failedStep = i; errorMessage = result.stderr; break; }
        } else if (step.onFail === 'rollback' && plan.rollbackSteps.length > 0) {
          this.log('Rolling back...', 'warn');
          const rollbackOutput = await this.executeRollback(plan.rollbackSteps);
          outputs.push(`ROLLBACK:\n${rollbackOutput}`);
          learnings.push(`Rollback executed after ${step.tool} failure`);
          failedStep = i; errorMessage = result.stderr; break;
        } else if (step.onFail === 'ask') {
          failedStep = i;
          errorMessage = `Step ${step.tool} failed — requires user intervention: ${result.stderr}`;
          break;
        } else {
          learnings.push(`Skipped ${step.tool} due to failure: ${result.stderr}`);
          if (step.onFail === 'abort') { failedStep = i; errorMessage = result.stderr; break; }
        }
      } else {
        if (step.validate && !step.validate(result.stdout)) {
          this.log(`Validation failed for step ${i + 1}`, 'error');
          failedStep = i; errorMessage = 'Validation failed'; break;
        }
        learnings.push(`${step.tool} executed successfully`);
      }
    }

    const success = failedStep === -1;
    await this.memory.saveOutcome({
      planId: plan.id, intent: plan.intent, success,
      failedStep: failedStep >= 0 ? failedStep : undefined,
      errorMessage: errorMessage || undefined,
      timestamp: Date.now(), learnings,
    });

    this.log(success ? 'Plan completed successfully' : `Plan failed at step ${failedStep + 1}: ${errorMessage}`, success ? 'success' : 'error');
    return { success, output: outputs.join('\n\n'), learnings };
  }

  private async executeStep(step: ActionStep): Promise<ShellResult> {
    switch (step.tool) {
      case 'shell': return runShell(step.params.cmd, { cwd: step.params.cwd, timeout: step.params.timeout || 60000 });
      case 'core_install':
        try { const out = await this.coreTermux.install(step.params.module, step.params.tools); return { stdout: out, stderr: '', exitCode: 0, duration: 0, command: `core install ${step.params.module}` }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: `core install ${step.params.module}` }; }
      case 'core_init':
        try { const out = await this.coreTermux.initProject(step.params.template, step.params.cwd); return { stdout: out, stderr: '', exitCode: 0, duration: 0, command: `core init ${step.params.template}` }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: `core init ${step.params.template}` }; }
      case 'core_env_set':
        try { const out = await this.coreTermux.envSet(step.params.key, step.params.value); return { stdout: out, stderr: '', exitCode: 0, duration: 0, command: `core env set ${step.params.key}` }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: `core env set ${step.params.key}` }; }
      case 'core_pg':
        try { const out = await this.coreTermux.pg(step.params.command, step.params.arg); return { stdout: out, stderr: '', exitCode: 0, duration: 0, command: `core pg ${step.params.command}` }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: `core pg ${step.params.command}` }; }
      case 'brain_search':
        try { const out = await this.coreTermux.brainSearch(step.params.query); return { stdout: out, stderr: '', exitCode: 0, duration: 0, command: `core brain search ${step.params.query}` }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: `core brain search ${step.params.query}` }; }
      case 'device_state':
        try { const state = await this.deviceControl.getDeviceState(); return { stdout: JSON.stringify(state, null, 2), stderr: '', exitCode: 0, duration: 0, command: 'device_state' }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: 'device_state' }; }
      case 'device_screenshot':
        try { const path = await this.deviceControl.takeScreenshot(step.params.path); return { stdout: `Screenshot saved: ${path}`, stderr: '', exitCode: 0, duration: 0, command: 'device_screenshot' }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: 'device_screenshot' }; }
      case 'device_tap':
        try { const out = await this.deviceControl.tap(step.params.x, step.params.y); return { stdout: out, stderr: '', exitCode: 0, duration: 0, command: 'device_tap' }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: 'device_tap' }; }
      case 'device_swipe':
        try { const out = await this.deviceControl.swipe(step.params.x1, step.params.y1, step.params.x2, step.params.y2, step.params.duration); return { stdout: out, stderr: '', exitCode: 0, duration: 0, command: 'device_swipe' }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: 'device_swipe' }; }
      case 'device_list_apps':
        try { const apps = await this.deviceControl.listApps(); return { stdout: JSON.stringify(apps.slice(0, 20), null, 2), stderr: '', exitCode: 0, duration: 0, command: 'device_list_apps' }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: 'device_list_apps' }; }
      case 'device_launch_app':
        try { const out = await this.deviceControl.launchApp(step.params.packageName); return { stdout: out, stderr: '', exitCode: 0, duration: 0, command: 'device_launch_app' }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: 'device_launch_app' }; }
      case 'device_press_button':
        try { const out = await this.deviceControl.pressButton(step.params.button); return { stdout: out, stderr: '', exitCode: 0, duration: 0, command: 'device_press_button' }; }
        catch (e: any) { return { stdout: '', stderr: e.message, exitCode: 1, duration: 0, command: 'device_press_button' }; }
      default:
        return { stdout: '', stderr: `Unknown tool: ${step.tool}`, exitCode: 1, duration: 0, command: step.tool };
    }
  }

  private async executeRollback(steps: ActionStep[]): Promise<string> {
    const outputs: string[] = [];
    for (const step of steps) {
      const result = await this.executeStep(step);
      outputs.push(`ROLLBACK ${step.tool}: ${result.exitCode === 0 ? 'OK' : 'FAILED — ' + result.stderr}`);
    }
    return outputs.join('\n');
  }

  private log(msg: string, type: string) {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    if (this.onLog) this.onLog(msg, type);
  }
}
