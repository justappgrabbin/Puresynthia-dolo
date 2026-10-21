const WORKER_TIMEOUT_MS = 10000;

function cloneSafe(value) {
  try { return structuredClone(value); }
  catch {
    try { return JSON.parse(JSON.stringify(value)); }
    catch { return String(value); }
  }
}

export async function runJavaScript(code, input = null, { timeoutMs = WORKER_TIMEOUT_MS } = {}) {
  const source = `
    const safe = value => {
      try { return structuredClone(value); }
      catch {
        try { return JSON.parse(JSON.stringify(value)); }
        catch { return String(value); }
      }
    };

    self.onmessage = async event => {
      const logs = [];
      const capture = (...args) => logs.push(args.map(safe));
      const localConsole = {
        log: capture,
        info: capture,
        warn: capture,
        error: capture,
        debug: capture,
      };

      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction(
          "console",
          "input",
          '"use strict";\\n' + String(event.data.code)
        );
        const value = await fn(localConsole, event.data.input);
        self.postMessage({ ok:true, logs, returnValue:safe(value) });
      } catch (error) {
        self.postMessage({
          ok:false,
          logs,
          error:String(error?.stack || error?.message || error)
        });
      }
    };
  `;

  const blob = new Blob([source], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);

  try {
    return await new Promise((resolve) => {
      const timer = setTimeout(() => {
        worker.terminate();
        resolve({ ok:false, logs:[], error:`JavaScript worker timed out after ${timeoutMs} ms` });
      }, timeoutMs);

      worker.onmessage = event => {
        clearTimeout(timer);
        resolve(cloneSafe(event.data));
      };

      worker.onerror = event => {
        clearTimeout(timer);
        resolve({ ok:false, logs:[], error:String(event.message || 'Worker execution error') });
      };

      worker.postMessage({ code:String(code ?? ''), input:cloneSafe(input) });
    });
  } finally {
    worker.terminate();
    URL.revokeObjectURL(url);
  }
}
