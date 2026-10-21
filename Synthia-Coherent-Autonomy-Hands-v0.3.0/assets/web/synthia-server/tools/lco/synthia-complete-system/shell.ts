/**
 * Shell execution with retry, timeout, and output capture
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const execAsync = promisify(exec);

const LOG_DIR = `${process.env.HOME}/.cache/synthia-kiosk/logs`;

async function ensureLogDir() {
  try { await mkdir(LOG_DIR, { recursive: true }); } catch {}
}

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  command: string;
}

export async function runShell(
  command: string,
  options: {
    cwd?: string;
    timeout?: number;
    retries?: number;
    env?: Record<string, string>;
    logOutput?: boolean;
  } = {}
): Promise<ShellResult> {
  await ensureLogDir();

  const { cwd, timeout = 60000, retries = 0, env = {}, logOutput = true } = options;
  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        env: { ...process.env, ...env },
        maxBuffer: 10 * 1024 * 1024,
      });

      const duration = Date.now() - startTime;

      if (logOutput) {
        const logFile = `${LOG_DIR}/shell_${Date.now()}.log`;
        await mkdir(dirname(logFile), { recursive: true });
        const stream = createWriteStream(logFile);
        stream.write(`CMD: ${command}\n`);
        stream.write(`CWD: ${cwd || process.cwd()}\n`);
        stream.write(`EXIT: 0\n`);
        stream.write(`DURATION: ${duration}ms\n`);
        stream.write(`STDOUT:\n${stdout}\n`);
        stream.write(`STDERR:\n${stderr}\n`);
        stream.end();
      }

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        duration,
        command,
      };
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  const duration = Date.now() - startTime;
  return {
    stdout: '',
    stderr: lastError?.message || 'Unknown error',
    exitCode: lastError?.code || 1,
    duration,
    command,
  };
}

export async function checkCommand(cmd: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`command -v ${cmd}`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function isTermux(): Promise<boolean> {
  return process.env.TERMUX_VERSION !== undefined || 
         process.env.PREFIX?.includes('termux') === true ||
         await checkCommand('termux-info');
}
