/**
 * Core-Termux Tool Wrappers
 */
import { runShell } from '../utils/shell.js';

export class CoreTermuxTools {
  async install(module: string, tools?: string[]): Promise<string> {
    const flags = tools?.map(t => `\-${\-t}`).join(' ') || '';
    const result = await runShell(`core install ${module} ${flags}`, { timeout: 300000, retries: 1 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return result.stdout;
  }

  async envSet(key: string, value: string): Promise<string> {
    const result = await runShell(`printf '${key}\n${value}\n' | core env set`, { timeout: 30000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return result.stdout;
  }

  async envList(): Promise<string> {
    const result = await runShell('core env ls', { timeout: 10000 });
    return result.stdout;
  }

  async pg(command: string, arg?: string): Promise<string> {
    const result = await runShell(`core pg ${command} ${arg || ''}`, { timeout: 30000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return result.stdout;
  }

  async brainSave(title: string, category: string, tags: string[], content: string): Promise<string> {
    const tagStr = tags.join(', ');
    const script = `cat << 'SYNTHIA_EOF' | core brain save
${title}
${category}
${tagStr}
${content}
SYNTHIA_EOF`;
    const result = await runShell(script, { timeout: 30000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return result.stdout;
  }

  async brainSearch(query: string): Promise<string> {
    const result = await runShell(`core brain search "${query}"`, { timeout: 30000 });
    return result.stdout;
  }

  async initProject(template: string, cwd?: string): Promise<string> {
    const result = await runShell(`core init ${template}`, { cwd, timeout: 120000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return result.stdout;
  }

  async list(module: string): Promise<string> {
    const result = await runShell(`core list ${module}`, { timeout: 10000 });
    return result.stdout;
  }

  async update(target: string, tools?: string[]): Promise<string> {
    const flags = tools?.map(t => `\-${\-t}`).join(' ') || '';
    const result = await runShell(`core update ${target} ${flags}`, { timeout: 300000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return result.stdout;
  }

  async getVersion(): Promise<string> {
    const result = await runShell('core --version', { timeout: 10000 });
    return result.stdout;
  }
}
