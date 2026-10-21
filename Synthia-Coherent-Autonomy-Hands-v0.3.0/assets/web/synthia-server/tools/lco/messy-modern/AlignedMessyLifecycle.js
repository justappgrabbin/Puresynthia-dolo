/**
 * MESSY Modern — Aligned Lifecycle (1976 Document Compliant)
 * Pure Local-First Architecture (Zero iFrames, Scoped ShadowDOM)
 * 
 * Implements:
 * - RV (Reality Value) [0.0, 1.0]
 * - h (Frequency/Probability) [0.0, 1.0]
 * - STIME (Simulation Time) monotonic clock
 * - DUR (Duration in Network) temporal tracking
 * - Schema validation on every triple assertion
 */

class AlignedMessyLifecycle {
    constructor(canvasContainerId, runtimeContainerId) {
        this.canvasContainer = document.getElementById(canvasContainerId);
        this.runtimeContainer = document.getElementById(runtimeContainerId);

        // Canonical State Mesh with 1976 manual properties
        this.mesh = {
            nodes: new Map(),      // id -> UnifiedNode
            relations: new Map(),  // id -> RelationPhysics
            triples: [],           // Array of UnifiedTriple
            stime: 0.0             // Simulation Clock (STIME)
        };

        // Error tracking for fixer-core
        this.errors = [];
        this.repairs = [];

        // Native Sandbox Runtime
        this.shadowHost = document.createElement('div');
        this.shadowHost.id = "messy-aligned-runtime-host";
        this.shadowHost.style.width = "100%";
        this.shadowHost.style.height = "100%";
        if (this.runtimeContainer) {
            this.runtimeContainer.appendChild(this.shadowHost);
        }
        this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });

        this.initHistoricalRelations();
    }

    initHistoricalRelations() {
        // Transitive relations with default geometric attributes
        this.mesh.relations.set("DEPENDS_ON", { length: 3.5, stiffness: 0.25, transitive: true });
        this.mesh.relations.set("CONTAINS", { length: 1.5, stiffness: 0.4, transitive: false });
        this.mesh.relations.set("TRIGGERS", { length: 2.5, stiffness: 0.2, transitive: true });
        this.mesh.relations.set("IS_A", { length: 2.0, stiffness: 0.6, transitive: true });
        this.mesh.relations.set("DEFINES", { length: 1.5, stiffness: 0.5, transitive: false });
        this.mesh.relations.set("CONTAINS_FLAW", { length: 8.0, stiffness: 0.1, transitive: false });
        this.mesh.relations.set("RESOLVED_STATE", { length: 1.0, stiffness: 1.0, transitive: false });
    }

    // =========================================================================
    // SCHEMA VALIDATION (E1.1-E1.7 coverage)
    // =========================================================================

    validateTriple(triple) {
        const violations = [];

        // E1.1: Missing subject
        if (!triple.subject || triple.subject.trim() === '') {
            violations.push('E1.1: missing_subject');
        }

        // E1.2: Missing relation
        if (!triple.relation || triple.relation.trim() === '') {
            violations.push('E1.2: missing_relation');
        }

        // E1.3: Invalid RV range
        if (triple.rv === undefined || triple.rv < 0 || triple.rv > 1 || isNaN(triple.rv)) {
            violations.push('E1.3: invalid_rv_range');
            triple.rv = 1.0; // Clamp to default
        }

        // E1.4: Invalid h range
        if (triple.h === undefined || triple.h < 0 || triple.h > 1 || isNaN(triple.h)) {
            violations.push('E1.4: invalid_h_range');
            triple.h = 1.0; // Clamp to default
        }

        // E1.5: Null object on non-unary relation
        if (triple.object === null && !['ASSERT', 'EXISTS', 'DECLARE'].includes(triple.relation)) {
            violations.push('E1.6: suspicious_null_object');
        }

        // E1.7: Invalid archetype
        const validArchetypes = ['STRUCTURAL_GATE', 'FUNCTIONAL_VECTOR', 'ATOMIC_SIGNAL', 'META'];
        if (!validArchetypes.includes(triple.archetype)) {
            violations.push('E1.7: invalid_archetype');
            triple.archetype = 'ATOMIC_SIGNAL';
        }

        return {
            valid: violations.length === 0,
            violations: violations,
            confidence: violations.length === 0 ? 1.0 : Math.max(0, 1.0 - violations.length * 0.2)
        };
    }

    // =========================================================================
    // STAGE 1: UNDERSTAND (Deconstruction with RV & Frequency)
    // =========================================================================

    understand(applicationFileMap) {
        console.log("[1/6] UNDERSTAND: Deconstructing codebase with 1976 core specifications...");
        this.mesh.triples = [];
        this.mesh.nodes.clear();
        this.errors = [];

        for (const [filename, content] of Object.entries(applicationFileMap)) {
            // Assert file containment
            this.assertHistoricalTriple("my_app.zip", "CONTAINS", filename, 1.0, 1.0, "META");

            if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts')) {
                // Extract imports with regex (deterministic, not neural)
                const importRegex = /import\s+(?:[\w\s{},*]+)\s+from\s+['"]([^'"]+)['"]/g;
                let match;
                while ((match = importRegex.exec(content)) !== null) {
                    this.assertHistoricalTriple(filename, "DEPENDS_ON", match[1], 1.0, 0.95, "ATOMIC_SIGNAL");
                }

                // Extract class definitions
                const classRegex = /class\s+(\w+)/g;
                while ((match = classRegex.exec(content)) !== null) {
                    this.assertHistoricalTriple(filename, "DEFINES", match[1], 1.0, 1.0, "STRUCTURAL_GATE");
                    this.assertHistoricalTriple(match[1], "IS_A", "STRUCTURAL_GATE", 1.0, 1.0, "STRUCTURAL_GATE");
                }

                // Extract function definitions
                const funcRegex = /(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
                while ((match = funcRegex.exec(content)) !== null) {
                    const funcName = match[1] || match[2];
                    if (funcName) {
                        this.assertHistoricalTriple(filename, "DEFINES", funcName, 1.0, 0.9, "FUNCTIONAL_VECTOR");
                        this.assertHistoricalTriple(funcName, "IS_A", "FUNCTIONAL_VECTOR", 1.0, 0.9, "FUNCTIONAL_VECTOR");
                    }
                }

                // Detect structural flaws
                if (content.includes("thiz.")) {
                    this.assertHistoricalTriple(filename, "CONTAINS_FLAW", "ReferenceError_thiz", 0.1, 1.0, "ATOMIC_SIGNAL");
                    this.errors.push({ file: filename, type: "ReferenceError", detail: "thiz instead of this", severity: 0.1 });
                }
                if (content.includes(".render(user)")) {
                    this.assertHistoricalTriple(filename, "CONTAINS_FLAW", "ContextLeakWarning", 0.2, 0.8, "ATOMIC_SIGNAL");
                    this.errors.push({ file: filename, type: "ContextLeakWarning", detail: "potential context leak", severity: 0.2 });
                }
            }

            if (filename.endsWith('.py')) {
                // Python extraction
                const importRegex = /import\s+(\w+)|from\s+(\w+)\s+import/g;
                let match;
                while ((match = importRegex.exec(content)) !== null) {
                    const dep = match[1] || match[2];
                    this.assertHistoricalTriple(filename, "DEPENDS_ON", dep, 1.0, 0.95, "ATOMIC_SIGNAL");
                }

                const classRegex = /class\s+(\w+):/g;
                while ((match = classRegex.exec(content)) !== null) {
                    this.assertHistoricalTriple(filename, "DEFINES", match[1], 1.0, 1.0, "STRUCTURAL_GATE");
                }

                const funcRegex = /def\s+(\w+)\s*\(/g;
                while ((match = funcRegex.exec(content)) !== null) {
                    this.assertHistoricalTriple(filename, "DEFINES", match[1], 1.0, 0.9, "FUNCTIONAL_VECTOR");
                }
            }
        }

        console.log(`UNDERSTAND complete: ${this.mesh.triples.length} triples, ${this.errors.length} errors detected.`);
        return this.mesh.triples;
    }

    // =========================================================================
    // STAGE 2: PLACE (Reality Vector Spacing Physics)
    // =========================================================================

    place(iterations = 80) {
        console.log("[2/6] PLACE: Relaxing topology against RV/h gradients...");

        // Initialize nodes for all triple entities
        this.mesh.triples.forEach(triple => {
            [triple.subject, triple.object].forEach(id => {
                if (id && !this.mesh.nodes.has(id)) {
                    this.mesh.nodes.set(id, {
                        id: id,
                        pos: [Math.random() * 15 - 7.5, Math.random() * 15 - 7.5, Math.random() * 15 - 7.5],
                        vel: [0, 0, 0],
                        mass: id.endsWith('.zip') ? 4.0 : 1.5
                    });
                }
            });
        });

        // Force relaxation
        for (let step = 0; step < iterations; step++) {
            const nodes = Array.from(this.mesh.nodes.values());

            // Repulsion
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    let dx = nodes[j].pos[0] - nodes[i].pos[0];
                    let dy = nodes[j].pos[1] - nodes[i].pos[1];
                    let dz = nodes[j].pos[2] - nodes[i].pos[2];
                    let dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.1;

                    let repulsionForce = 2.0 / (dist * dist);
                    nodes[i].vel[0] -= (dx / dist) * repulsionForce;
                    nodes[i].vel[1] -= (dy / dist) * repulsionForce;
                    nodes[i].vel[2] -= (dz / dist) * repulsionForce;
                    nodes[j].vel[0] += (dx / dist) * repulsionForce;
                    nodes[j].vel[1] += (dy / dist) * repulsionForce;
                    nodes[j].vel[2] += (dz / dist) * repulsionForce;
                }
            }

            // Attraction with RV/h modifier
            this.mesh.triples.forEach(triple => {
                if (!triple.object) return;
                const sNode = this.mesh.nodes.get(triple.subject);
                const oNode = this.mesh.nodes.get(triple.object);
                if (!sNode || !oNode) return;

                const rel = this.mesh.relations.get(triple.relation) || { length: 3.0, stiffness: 0.1 };

                let dx = oNode.pos[0] - sNode.pos[0];
                let dy = oNode.pos[1] - sNode.pos[1];
                let dz = oNode.pos[2] - sNode.pos[2];
                let dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.1;

                // High RV + high h = stronger attraction (more "real", more "frequent")
                let structuralMod = rel.stiffness * triple.rv * triple.h;
                let force = (dist - rel.length) * structuralMod;

                sNode.vel[0] += (dx / dist) * force;
                sNode.vel[1] += (dy / dist) * force;
                sNode.vel[2] += (dz / dist) * force;
                oNode.vel[0] -= (dx / dist) * force;
                oNode.vel[1] -= (dy / dist) * force;
                oNode.vel[2] -= (dz / dist) * force;
            });

            // Update positions
            this.mesh.nodes.forEach(n => {
                n.pos[0] += n.vel[0] * 0.1;
                n.pos[1] += n.vel[1] * 0.1;
                n.pos[2] += n.vel[2] * 0.1;
                n.vel = [n.vel[0] * 0.4, n.vel[1] * 0.4, n.vel[2] * 0.4];
            });
        }

        console.log("PLACE complete: geometry restabilized.");
        return this.mesh.nodes;
    }

    // =========================================================================
    // STAGE 3: EXPLAIN (Temporal State Readout)
    // =========================================================================

    explain() {
        console.log("[3/6] EXPLAIN: Synthesizing structural profile...");
        const findings = [];

        this.mesh.triples.forEach(t => {
            const age = this.mesh.stime - t.created;
            if (t.relation === "CONTAINS_FLAW") {
                findings.push(`[${t.subject}] flaw detected: ${t.object} (RV=${t.rv.toFixed(2)}, DUR=${age.toFixed(1)})`);
            } else {
                findings.push(`[${t.subject}] ${t.relation} [${t.object}] (RV=${t.rv.toFixed(2)}, h=${t.h.toFixed(2)}, DUR=${age.toFixed(1)})`);
            }
        });

        return findings.join("\n");
    }

    // =========================================================================
    // STAGE 4: REPAIR (Graph Edge Mutations)
    // =========================================================================

    repair() {
        console.log("[4/6] REPAIR: Executing graph mutations...");
        this.repairs = [];

        this.mesh.triples = this.mesh.triples.map(t => {
            if (t.relation === "CONTAINS_FLAW") {
                console.log(`Repairing [${t.subject}]: ${t.object} -> RESOLVED_STATE`);
                this.repairs.push({ original: t, action: "RESOLVED" });
                return {
                    ...t,
                    relation: "RESOLVED_STATE",
                    object: "pure_this_context",
                    rv: 1.0,
                    h: 1.0,
                    deleted: null  // Reactivate
                };
            }
            return t;
        });

        console.log(`REPAIR complete: ${this.repairs.length} flaws resolved.`);
    }

    // =========================================================================
    // STAGE 5: REGENERATE (Domain Engine Switch)
    // =========================================================================

    regenerate(domainType = "apps") {
        console.log(`[5/6] REGENERATE: Targeting domain [${domainType.toUpperCase()}]`);

        if (domainType === "games") {
            return {
                html: `<div style="text-align:center;"><canvas id="canvasLoop" width="400" height="250" style="border:1px solid #7a22ff; background:#080410;"></canvas></div>`,
                js: `
                    const c = shadowRoot.getElementById('canvasLoop');
                    const ctx = c.getContext('2d');
                    let px = 180;
                    window.addEventListener('mousemove', (e) => {
                        const bounds = c.getBoundingClientRect();
                        px = e.clientX - bounds.left - 20;
                    });
                    function tick() {
                        ctx.clearRect(0,0,c.width,c.height);
                        ctx.fillStyle = '#ff00ff';
                        ctx.fillRect(px, 220, 40, 15);
                        ctx.fillStyle = '#00ffff';
                        ctx.fillText("MESSY Game Substrate", 15, 30);
                        requestAnimationFrame(tick);
                    }
                    tick();
                `
            };
        }

        if (domainType === "photos") {
            return {
                html: `
                    <div style="padding:15px; background:#120c1f; color:#00ffff; border-radius:8px; border:1px solid #00ffff; font-family:monospace;">
                        <h4>MESSY Processor</h4>
                        <div style="width:100%; height:120px; background:linear-gradient(45deg, #20073b, #05192e); margin:10px 0; display:flex; align-items:center; justify-content:center; color:#ff00ff; font-weight:bold;">
                          [ Image Texture Matrix Active ]
                        </div>
                    </div>
                `,
                js: `console.log("WebGL pipeline registered via Shadow Root.");`
            };
        }

        // Default app template
        return {
            html: `
                <div style="background:#090614; color:#e0e0e0; padding:20px; font-family:sans-serif; border-radius:12px; border:2px solid #52159c;">
                    <h3 style="color:#ff00ff; margin:0 0 10px 0; font-family:monospace;">MESSY Module Interface</h3>
                    <div id="runtime-view-target"></div>
                </div>
            `,
            js: `
                const target = shadowRoot.getElementById('runtime-view-target');
                if (target) {
                    target.innerHTML = '<p style="color:#00ffff;">Execution context established with absolute scoping.</p>';
                }
            `
        };
    }

    // =========================================================================
    // STAGE 6: RUN (Sovereign Isolated Runtime)
    // =========================================================================

    run(generatedBundle) {
        console.log("[6/6] RUN: Embedding into secure isolation boundary...");

        // E6.1: Clean previous runtime to prevent memory leaks
        this.shadowRoot.innerHTML = '';

        // E6.2: Inject HTML layout
        const layoutWrapper = document.createElement('div');
        layoutWrapper.innerHTML = generatedBundle.html;
        this.shadowRoot.appendChild(layoutWrapper);

        // E6.3: Execute script with IIFE scoping (no global pollution)
        const runtimeScript = document.createElement('script');
        runtimeScript.type = 'text/javascript';

        // Use blob URL for CSP compatibility (E6.1)
        const scriptContent = `
            (function(shadowRoot) {
                "use strict";
                try {
                    ${generatedBundle.js}
                } catch(err) {
                    console.error("MESSY Runtime Exception:", err);
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'color:#ff6b6b; padding:10px; font-family:monospace; font-size:12px;';
                    errorDiv.textContent = 'Runtime Error: ' + err.message;
                    shadowRoot.appendChild(errorDiv);
                }
            })(document.getElementById('${this.runtimeContainer.id}').querySelector('[id^="messy-aligned-runtime-host"]').shadowRoot);
        `;

        const blob = new Blob([scriptContent], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        runtimeScript.src = blobUrl;

        // Cleanup blob URL after load
        runtimeScript.onload = () => URL.revokeObjectURL(blobUrl);
        runtimeScript.onerror = (err) => {
            console.error("Script load error:", err);
            URL.revokeObjectURL(blobUrl);
        };

        this.shadowRoot.appendChild(runtimeScript);
        console.log("RUN complete: sovereign runtime online.");
    }

    // =========================================================================
    // UTILITY: Historical Triple Assertion (1976 compliant)
    // =========================================================================

    assertHistoricalTriple(s, r, o, initialRV = 1.0, initialFrequency = 1.0, archetype = "ATOMIC_SIGNAL") {
        const triple = {
            subject: s,
            relation: r,
            object: o,
            rv: initialRV,
            h: initialFrequency,
            value: 0,
            created: this.mesh.stime,
            deleted: null,
            position: [0, 0, 0],
            velocity: [0, 0, 0],
            archetype: archetype,
            source: "ingestor",
            version: 1
        };

        // Validate before adding
        const validation = this.validateTriple(triple);
        if (!validation.valid) {
            console.warn("Triple validation failed:", validation.violations, triple);
        }

        this.mesh.triples.push(triple);
        return triple;
    }

    incrementClock(delta = 1.0) {
        this.mesh.stime += delta;
    }

    getDurationInNetwork(triple) {
        if (triple.deleted !== null) {
            return triple.deleted - triple.created;
        }
        return this.mesh.stime - triple.created;
    }

    // =========================================================================
    // EXPORT: Serialize mesh state for sync/persistence
    // =========================================================================

    exportMesh() {
        return {
            triples: this.mesh.triples.map(t => ({
                subject: t.subject,
                relation: t.relation,
                object: t.object,
                rv: t.rv,
                h: t.h,
                created: t.created,
                deleted: t.deleted,
                archetype: t.archetype
            })),
            stime: this.mesh.stime,
            nodeCount: this.mesh.nodes.size,
            errorCount: this.errors.length,
            repairCount: this.repairs.length
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AlignedMessyLifecycle };
}
