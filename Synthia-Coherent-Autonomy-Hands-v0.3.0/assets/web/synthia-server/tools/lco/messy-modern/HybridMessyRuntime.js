/**
 * MESSY Modern v1.1 — Hybrid Isolation Substrate
 * Shadow DOM (open) for Three.js visualization | Sandboxed iframe for execution
 * 
 * Security: iframe.sandbox = 'allow-scripts' (NO allow-same-origin)
 * Telemetry: postMessage bridge for crash → CONTAINS_FLAW triples
 */

class HybridMessyRuntime {
    constructor(visualContainerId, runnerContainerId, meshInstance) {
        this.visualContainer = document.getElementById(visualContainerId);
        this.runnerContainer = document.getElementById(runnerContainerId);
        this.mesh = meshInstance;

        this.iframe = null;
        this.host = null;
        this.shadow = null;

        this.initSurfaces();
    }

    initSurfaces() {
        // 1. VISUAL SURFACE: Shadow DOM (open) for Three.js
        if (this.visualContainer) {
            this.visualContainer.innerHTML = '';
            this.host = document.createElement('div');
            this.host.id = 'messy-ui-viewport';
            this.host.style.cssText = 'width:100%; height:100%; position:relative;';
            this.visualContainer.appendChild(this.host);

            // OPEN mode — allows programmatic access for canvas manipulation
            this.shadow = this.host.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = `
                <style>
                    :host { display: block; font-family: monospace; color: #00d4ff; }
                    #canvas3d { width: 100%; height: 100%; display: block; }
                    .ui-overlay { 
                        position: absolute; top: 10px; left: 10px; 
                        background: rgba(10,10,20,0.85); padding: 10px; 
                        border: 1px solid #52159c; border-radius: 4px;
                        font-size: 11px; pointer-events: none;
                    }
                </style>
                <div id="canvas3d"></div>
                <div class="ui-overlay">MESSY Core [STIME: <span id="stime-display">0.00</span>]</div>
            `;
        }

        // 2. EXECUTION SURFACE: Sandboxed iframe (origin-null)
        if (this.runnerContainer) {
            this.runnerContainer.innerHTML = '';
            this.iframe = document.createElement('iframe');

            // SECURITY: NO allow-same-origin. This creates origin-null isolation.
            // The iframe cannot access parent cookies, localStorage, or DOM.
            this.iframe.sandbox = 'allow-scripts';
            this.iframe.style.cssText = 'width:100%; height:100%; border:none; background:#000000;';
            this.runnerContainer.appendChild(this.iframe);

            this.setupTelemetryBridge();
        }
    }

    setupTelemetryBridge() {
        window.addEventListener('message', (e) => {
            // SECURITY: Only accept messages from our managed iframe
            if (!this.iframe || e.source !== this.iframe.contentWindow) return;

            const payload = e.data;
            if (payload && payload.surface === 'MESSY_RUNTIME') {
                this.routeTelemetryToMesh(payload);
            }
        });
    }

    routeTelemetryToMesh(data) {
        console.warn(`[MESSY RUNTIME EXCEPTION] ${data.errorClass}: ${data.message}`);

        if (this.mesh && typeof this.mesh.assertTriple === 'function') {
            const sanitized = (data.sanitizedIdent || 'runtime_error').substring(0, 30);
            this.mesh.assertTriple(
                'SYNTHESIZED_RUNTIME',
                'CONTAINS_FLAW',
                sanitized,
                { rv: 0.1, h: 1.0, archetype: 'META', source: 'selfmod' }
            );

            // Also log to error tracking
            if (this.mesh.errors) {
                this.mesh.errors.push({
                    type: data.errorClass,
                    message: data.message,
                    line: data.line,
                    stime: this.mesh.stime || 0
                });
            }
        }

        // Trigger repair if available
        if (typeof this.mesh.onRuntimeError === 'function') {
            this.mesh.onRuntimeError(data);
        }
    }

    run(bundle) {
        if (!this.iframe) {
            console.error('Execution iframe not initialized');
            return;
        }

        const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
        if (!doc) {
            console.error('Cannot access sandboxed document');
            return;
        }

        // Crash trap: intercepts errors and posts them to parent
        const crashTrap = `
            window.onerror = function(msg, url, line, col, error) {
                const ident = (msg || 'runtime_panic').toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 30);
                window.parent.postMessage({
                    surface: 'MESSY_RUNTIME',
                    type: 'CRASH',
                    errorClass: 'E6_EXECUTE',
                    message: msg,
                    sanitizedIdent: ident,
                    line: line
                }, '*');
                return true;
            };
            console.error = (function(orig) {
                return function(msg) {
                    window.parent.postMessage({
                        surface: 'MESSY_RUNTIME',
                        type: 'LOG_ERROR',
                        errorClass: 'E6_EXECUTE',
                        message: String(msg),
                        sanitizedIdent: String(msg).toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 30)
                    }, '*');
                    orig.apply(console, arguments);
                };
            })(console.error);
        `;

        doc.open();
        doc.write(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; canvas-src 'self';">
    <style>
        body { margin: 0; background: #0a0a0f; color: #e0e0e0; font-family: system-ui, sans-serif; overflow: auto; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #52159c; }
    </style>
    <script>${crashTrap}</script>
</head>
<body>
    ${bundle.html}
    <script>
        (function() {
            "use strict";
            try {
                ${bundle.js}
            } catch(err) {
                const ident = err.name.toLowerCase() + '_' + err.message.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 20);
                window.parent.postMessage({
                    surface: 'MESSY_RUNTIME',
                    type: 'CRASH',
                    errorClass: 'E5_GENERATE',
                    message: err.name + ': ' + err.message,
                    sanitizedIdent: ident
                }, '*');
            }
        })();
    </script>
</body>
</html>
        `);
        doc.close();
    }

    kill() {
        if (this.iframe) {
            console.log('Execution kill switch triggered');
            this.iframe.src = 'about:blank';
        }
    }

    updateSTIME(stime) {
        const display = this.shadow?.getElementById('stime-display');
        if (display) display.textContent = stime.toFixed(2);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HybridMessyRuntime };
}
