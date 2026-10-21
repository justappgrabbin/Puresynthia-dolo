const { useState, useEffect, useRef, useCallback } = React;

// ==================== DATA STORE ====================
const INITIAL_STATE = {
  activePage: 'dashboard',
  projects: [
    {
      id: 'synthia-os',
      name: 'Synthia OS',
      description: 'Living civilization platform with contextual trust emergence',
      status: 'active',
      lastBuild: '2026-06-30T18:42:00Z',
      builds: 47,
      successRate: 94,
      modules: 9,
      stack: ['TypeScript', 'React', 'Supabase', 'WebSocket'],
      goal: 'Create a self-expanding OS where files get ingested, analyzed, and mounted on the home screen',
      guidelines: [
        'Resonance consistency analysis over identity verification',
        'Discernment systems over authoritarian systems',
        'Earned trust through longitudinal coherence',
        'Layered access: Public → Verified Young → General → Restricted → Adult Sovereign'
      ]
    },
    {
      id: 'mrnn-engine',
      name: 'MRNN Engine',
      description: 'Morphological Resonance Neural Network — 64-operator cognitive physics',
      status: 'active',
      lastBuild: '2026-06-30T20:15:00Z',
      builds: 23,
      successRate: 91,
      modules: 5,
      stack: ['TypeScript', 'WebGL', 'TensorFlow.js'],
      goal: 'Universal engine: state → relation → tension → resolution → recursion',
      guidelines: [
        'Attractor geometry generates the embedding space',
        'D3 is the witness/observer-node where J(D1,D2) creates experience',
        '64 semantic particles with 10 properties, 6 binary dimensions',
        'Sentences become field interactions between particles'
      ]
    },
    {
      id: 'living-mirror',
      name: 'Living Mirror',
      description: 'Human Design app with Roxy API, natal charts, and magic squares',
      status: 'building',
      lastBuild: '2026-06-30T21:30:00Z',
      builds: 12,
      successRate: 88,
      modules: 7,
      stack: ['React', 'TypeScript', 'Roxy API', 'Canvas API'],
      goal: 'Integrate Roxy API bodygraph, natal chart, vedic kundli with scientific rigor',
      guidelines: [
        'Scientific rigor over flashy but broken deliverables',
        'Working code over flashy demos',
        'All 64 gates mapped to cognitive physics operators',
        'Magic squares with mathematical simulation'
      ]
    },
    {
      id: 'termux-mcp',
      name: 'Termux MCP Server',
      description: 'Smart Termux daemon with 45+ tools, UI automation, and proactive assistance',
      status: 'active',
      lastBuild: '2026-06-29T14:20:00Z',
      builds: 31,
      successRate: 96,
      modules: 4,
      stack: ['Python', 'Bash', 'Termux API', 'Tasker'],
      goal: 'Deploy and fix servers, manage apps, understand context, chain actions, learn from outcomes',
      guidelines: [
        'Proactive, contextual, adaptive — not just command routing',
        'Do things when needed, not just when asked',
        'Learn from outcomes and improve over time',
        'Chain actions intelligently'
      ]
    }
  ],
  builds: [
    { id: 1, project: 'Synthia OS', status: 'success', time: '18:42', duration: '4m 23s', commit: 'a3f7d2e', message: 'Add resonance consistency analyzer to trust layer' },
    { id: 2, project: 'MRNN Engine', status: 'success', time: '20:15', duration: '2m 51s', commit: 'b8e1c4a', message: 'Implement attractor field evolution with recursion' },
    { id: 3, project: 'Living Mirror', status: 'building', time: '21:30', duration: '—', commit: 'd2f9a1b', message: 'Integrate Roxy API bodygraph component' },
    { id: 4, project: 'Termux MCP', status: 'success', time: '14:20', duration: '1m 45s', commit: 'c5e3b8d', message: 'Add server healing capability with auto-repair' },
    { id: 5, project: 'Synthia OS', status: 'failed', time: '16:10', duration: '3m 12s', commit: 'f1a9c6e', message: 'Attempt Supabase realtime sync — connection timeout' },
    { id: 6, project: 'MRNN Engine', status: 'success', time: '19:05', duration: '2m 18s', commit: 'e7d4f2a', message: 'Optimize 64-operator tensor computation' },
  ],
  knowledge: {
    files: 156,
    concepts: 89,
    relations: 234,
    lastIngest: '2026-06-30T22:00:00Z',
    sources: [
      { name: 'ingestion-system.ts', type: 'TypeScript', size: '1201 lines', status: 'ingested' },
      { name: 'user-discernment.ts', type: 'TypeScript', size: '890 lines', status: 'ingested' },
      { name: 'life-purpose-alignment.ts', type: 'TypeScript', size: '756 lines', status: 'ingested' },
      { name: 'universal-engine.ts', type: 'TypeScript', size: '1342 lines', status: 'ingested' },
      { name: 'cognitive-physics-v5.ts', type: 'TypeScript', size: '2103 lines', status: 'ingested' },
      { name: 'coordinate-space-engine-v3.ts', type: 'TypeScript', size: '1876 lines', status: 'ingested' },
      { name: 'dise-miner.ts', type: 'TypeScript', size: '945 lines', status: 'ingested' },
      { name: 'morph-engine.ts', type: 'TypeScript', size: '678 lines', status: 'ingested' },
      { name: 'resonance-sgan.ts', type: 'TypeScript', size: '523 lines', status: 'ingested' },
      { name: 'fairyganmatter.ts', type: 'TypeScript', size: '612 lines', status: 'ingested' },
    ]
  },
  goals: [
    { id: 1, text: 'Build a self-expanding OS that grows with each file upload', priority: 'high', progress: 67, project: 'Synthia OS', dimension: 'D5' },
    { id: 2, text: 'Create universal cognitive physics engine with 64 operators', priority: 'high', progress: 82, project: 'MRNN Engine', dimension: 'D3' },
    { id: 3, text: 'Integrate Roxy API into Living Mirror with scientific rigor', priority: 'high', progress: 45, project: 'Living Mirror', dimension: 'D4' },
    { id: 4, text: 'Deploy smart Termux daemon that proactively manages servers', priority: 'medium', progress: 78, project: 'Termux MCP', dimension: 'D2' },
    { id: 5, text: 'Build DISEMINER narrative engine for HD app', priority: 'medium', progress: 34, project: 'Living Mirror', dimension: 'D5' },
    { id: 6, text: 'Map all 64 codons to 64 hexagrams to 20 amino acids to cognition', priority: 'high', progress: 91, project: 'MRNN Engine', dimension: 'D1' },
  ],
  guidelines: [
    { id: 1, text: 'Resonance consistency analysis over identity verification', category: 'trust', projects: ['Synthia OS'] },
    { id: 2, text: 'Discernment systems over authoritarian systems', category: 'governance', projects: ['Synthia OS'] },
    { id: 3, text: 'Earned trust through longitudinal coherence', category: 'trust', projects: ['Synthia OS'] },
    { id: 4, text: 'Attractor geometry generates the embedding space', category: 'cognition', projects: ['MRNN Engine'] },
    { id: 5, text: 'D3 is the witness/observer-node where J(D1,D2) creates experience', category: 'cognition', projects: ['MRNN Engine'] },
    { id: 6, text: 'Scientific rigor over flashy but broken deliverables', category: 'quality', projects: ['Living Mirror', 'All'] },
    { id: 7, text: 'Working code over flashy demos', category: 'quality', projects: ['Living Mirror', 'All'] },
    { id: 8, text: 'Proactive assistance — do things when needed, not just when asked', category: 'behavior', projects: ['Termux MCP'] },
    { id: 9, text: 'Stewardship > invention for living systems', category: 'philosophy', projects: ['Synthia OS'] },
    { id: 10, text: 'Layered access: Public → Verified Young → General → Restricted → Adult Sovereign', category: 'governance', projects: ['Synthia OS'] },
  ],
  pipeline: {
    stages: [
      { num: 1, name: 'Ingest', status: 'completed', desc: 'Read and validate source files' },
      { num: 2, name: 'Analyze', status: 'completed', desc: 'Extract concepts, patterns, and intent' },
      { num: 3, name: 'Understand', status: 'completed', desc: 'Map to existing knowledge graph' },
      { num: 4, name: 'Align', status: 'completed', desc: 'Match to goals and guidelines' },
      { num: 5, name: 'Design', status: 'active', desc: 'Generate architecture and plan' },
      { num: 6, name: 'Build', status: 'pending', desc: 'Write code and tests' },
      { num: 7, name: 'Verify', status: 'pending', desc: 'Run tests and validate' },
      { num: 8, name: 'Deploy', status: 'pending', desc: 'Package and deploy' },
      { num: 9, name: 'Monitor', status: 'pending', desc: 'Track performance and health' },
      { num: 10, name: 'Evolve', status: 'pending', desc: 'Learn and improve' },
    ],
    currentProject: 'Living Mirror',
    currentStage: 5
  },
  terminal: [
    { type: 'info', text: 'Synthia Build Station v2.0.0 initialized' },
    { type: 'success', text: 'Loaded 156 files from knowledge base' },
    { type: 'info', text: 'Mapped 89 concepts with 234 relations' },
    { type: 'success', text: '4 active projects detected' },
    { type: 'warn', text: 'Build #5 failed — Supabase connection timeout' },
    { type: 'info', text: 'Auto-repair initiated for failed build' },
    { type: 'success', text: 'Auto-repair complete — retrying with exponential backoff' },
    { type: 'info', text: 'Pipeline active: Living Mirror → Stage 5 (Design)' },
  ],
  notifications: 3
};

// ==================== ICONS ====================
const Icons = {
  Home: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
    React.createElement('polyline', { points: '9 22 9 12 15 12 15 22' })
  ),
  GitBranch: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('line', { x1: 6, y1: 3, x2: 6, y2: 15 }),
    React.createElement('circle', { cx: 18, cy: 6, r: 3 }),
    React.createElement('circle', { cx: 6, cy: 18, r: 3 }),
    React.createElement('path', { d: 'M18 9a9 9 0 0 1-9 9' })
  ),
  Brain: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z' }),
    React.createElement('path', { d: 'M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z' })
  ),
  Target: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
    React.createElement('circle', { cx: 12, cy: 12, r: 6 }),
    React.createElement('circle', { cx: 12, cy: 12, r: 2 }),
    React.createElement('line', { x1: 12, y1: 2, x2: 12, y2: 4 }),
    React.createElement('line', { x1: 12, y1: 20, x2: 12, y2: 22 }),
    React.createElement('line', { x1: 2, y1: 12, x2: 4, y2: 12 }),
    React.createElement('line', { x1: 20, y1: 12, x2: 22, y2: 12 })
  ),
  BookOpen: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' }),
    React.createElement('path', { d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' })
  ),
  Terminal: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '4 17 10 11 4 5' }),
    React.createElement('line', { x1: 12, y1: 19, x2: 20, y2: 19 })
  ),
  Settings: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }),
    React.createElement('circle', { cx: 12, cy: 12, r: 3 })
  ),
  Play: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor', stroke: 'none' },
    React.createElement('polygon', { points: '5 3 19 12 5 21 5 3' })
  ),
  Plus: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('line', { x1: 12, y1: 5, x2: 12, y2: 19 }),
    React.createElement('line', { x1: 5, y1: 12, x2: 19, y2: 12 })
  ),
  Check: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '20 6 9 17 4 12' })
  ),
  X: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }),
    React.createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 })
  ),
  AlertTriangle: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
    React.createElement('line', { x1: 12, y1: 9, x2: 12, y2: 13 }),
    React.createElement('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 })
  ),
  RefreshCw: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '23 4 23 10 17 10' }),
    React.createElement('polyline', { points: '1 20 1 14 7 14' }),
    React.createElement('path', { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' })
  ),
  Upload: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
    React.createElement('polyline', { points: '17 8 12 3 7 8' }),
    React.createElement('line', { x1: 12, y1: 3, x2: 12, y2: 15 })
  ),
  FileText: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' }),
    React.createElement('polyline', { points: '14 2 14 8 20 8' }),
    React.createElement('line', { x1: 16, y1: 13, x2: 8, y2: 13 }),
    React.createElement('line', { x1: 16, y1: 17, x2: 8, y2: 17 }),
    React.createElement('line', { x1: 10, y1: 9, x2: 8, y2: 9 })
  ),
  Layers: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polygon', { points: '12 2 2 7 12 12 22 7 12 2' }),
    React.createElement('polyline', { points: '2 17 12 22 22 17' }),
    React.createElement('polyline', { points: '2 12 12 17 22 12' })
  ),
  Zap: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polygon', { points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' })
  ),
  ChevronRight: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '9 18 15 12 9 6' })
  ),
  Bell: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }),
    React.createElement('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' })
  ),
  Search: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 11, cy: 11, r: 8 }),
    React.createElement('line', { x1: 21, y1: 21, x2: 16.65, y2: 16.65 })
  ),
  Activity: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' })
  ),
  Box: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
    React.createElement('polyline', { points: '3.27 6.96 12 12.01 20.73 6.96' }),
    React.createElement('line', { x1: 12, y1: 22.08, x2: 12, y2: 12 })
  ),
  Cpu: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('rect', { x: 4, y: 4, width: 16, height: 16, rx: 2 }),
    React.createElement('rect', { x: 9, y: 9, width: 6, height: 6 }),
    React.createElement('line', { x1: 9, y1: 1, x2: 9, y2: 4 }),
    React.createElement('line', { x1: 15, y1: 1, x2: 15, y2: 4 }),
    React.createElement('line', { x1: 9, y1: 20, x2: 9, y2: 23 }),
    React.createElement('line', { x1: 15, y1: 20, x2: 15, y2: 23 }),
    React.createElement('line', { x1: 20, y1: 9, x2: 23, y2: 9 }),
    React.createElement('line', { x1: 20, y1: 14, x2: 23, y2: 14 }),
    React.createElement('line', { x1: 1, y1: 9, x2: 4, y2: 9 }),
    React.createElement('line', { x1: 1, y1: 14, x2: 4, y2: 14 })
  ),
  Shield: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' })
  ),
  TrendingUp: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '23 6 13.5 15.5 8.5 10.5 1 18' }),
    React.createElement('polyline', { points: '17 6 23 6 23 12' })
  ),
  TrendingDown: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('polyline', { points: '23 18 13.5 8.5 8.5 13.5 1 6' }),
    React.createElement('polyline', { points: '17 18 23 18 23 12' })
  ),
  Clock: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
    React.createElement('polyline', { points: '12 6 12 12 16 14' })
  ),
  Hash: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('line', { x1: 4, y1: 9, x2: 20, y2: 9 }),
    React.createElement('line', { x1: 4, y1: 15, x2: 20, y2: 15 }),
    React.createElement('line', { x1: 10, y1: 3, x2: 8, y2: 21 }),
    React.createElement('line', { x1: 16, y1: 3, x2: 14, y2: 21 })
  ),
  Menu: () => React.createElement('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('line', { x1: 3, y1: 12, x2: 21, y2: 12 }),
    React.createElement('line', { x1: 3, y1: 6, x2: 21, y2: 6 }),
    React.createElement('line', { x1: 3, y1: 18, x2: 21, y2: 18 })
  ),
  Globe: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
    React.createElement('line', { x1: 2, y1: 12, x2: 22, y2: 12 }),
    React.createElement('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' })
  ),
  Compass: () => React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
    React.createElement('polygon', { points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' })
  ),
  Flame: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z' })
  ),
  Diamond: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M6 3h12l4 6-10 13L2 9l4-6z' }),
    React.createElement('path', { d: 'M11 3 8 9l4 13 4-13-3-6' }),
    React.createElement('path', { d: 'M2 9h20' })
  ),
  Eye: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' }),
    React.createElement('circle', { cx: 12, cy: 12, r: 3 })
  ),
  Sparkles: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z' })
  ),
};

// ==================== COMPONENTS ====================

const StatCard = ({ label, value, change, changeType, icon: Icon, color }) => {
  return React.createElement('div', { className: 'stat-card fade-in' },
    React.createElement('div', { className: 'stat-label' }, label),
    React.createElement('div', { className: 'stat-value', style: { color: color || 'var(--text-primary)' } }, value),
    change && React.createElement('div', { className: `stat-change ${changeType}` },
      changeType === 'positive' ? React.createElement(Icons.TrendingUp) : React.createElement(Icons.TrendingDown),
      change
    ),
    Icon && React.createElement('div', { style: { position: 'absolute', top: 16, right: 16, opacity: 0.15 } },
      React.createElement(Icon)
    )
  );
};

const Tag = ({ children, variant = 'cyan' }) => {
  const className = `tag tag-${variant}`;
  return React.createElement('span', { className }, children);
};

const Terminal = ({ lines }) => {
  return React.createElement('div', { className: 'terminal' },
    React.createElement('div', { className: 'terminal-header' },
      React.createElement('div', { className: 'terminal-dot red' }),
      React.createElement('div', { className: 'terminal-dot yellow' }),
      React.createElement('div', { className: 'terminal-dot green' }),
      React.createElement('span', { style: { marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' } }, 'synthia-build@station:~')
    ),
    React.createElement('div', { className: 'terminal-body' },
      lines.map((line, i) =>
        React.createElement('div', { key: i, className: `terminal-line ${line.type}` },
          React.createElement('span', { className: 'prompt' }, '> '),
          line.text
        )
      )
    )
  );
};

const Timeline = ({ items }) => {
  return React.createElement('div', { className: 'timeline' },
    items.map((item, i) =>
      React.createElement('div', { key: i, className: `timeline-item ${item.status}` },
        React.createElement('div', { className: 'timeline-time' }, item.time),
        React.createElement('div', { className: 'timeline-content' }, item.content),
        item.meta && React.createElement('div', { className: 'timeline-meta' }, item.meta)
      )
    )
  );
};

const KnowledgeGraph = () => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([
    { id: 'synthia', label: 'Synthia OS', x: 150, y: 80, color: 'var(--accent-cyan)', type: 'project' },
    { id: 'mrnn', label: 'MRNN Engine', x: 400, y: 60, color: 'var(--accent-purple)', type: 'project' },
    { id: 'mirror', label: 'Living Mirror', x: 280, y: 180, color: 'var(--accent-blue)', type: 'project' },
    { id: 'termux', label: 'Termux MCP', x: 520, y: 150, color: 'var(--accent-amber)', type: 'project' },
    { id: 'ingestion', label: 'Ingestion System', x: 80, y: 200, color: 'var(--accent-emerald)', type: 'system' },
    { id: 'discernment', label: 'User Discernment', x: 200, y: 280, color: 'var(--accent-rose)', type: 'system' },
    { id: 'alignment', label: 'Life Purpose Align', x: 380, y: 260, color: 'var(--accent-cyan)', type: 'system' },
    { id: 'universal', label: 'Universal Engine', x: 500, y: 280, color: 'var(--accent-purple)', type: 'system' },
    { id: 'cognitive', label: 'Cognitive Physics', x: 320, y: 340, color: 'var(--accent-blue)', type: 'system' },
    { id: 'dise', label: 'DISEMINER', x: 120, y: 340, color: 'var(--accent-amber)', type: 'system' },
  ]);

  const edges = [
    { from: 'synthia', to: 'ingestion' },
    { from: 'synthia', to: 'discernment' },
    { from: 'synthia', to: 'alignment' },
    { from: 'mrnn', to: 'universal' },
    { from: 'mrnn', to: 'cognitive' },
    { from: 'mirror', to: 'cognitive' },
    { from: 'mirror', to: 'dise' },
    { from: 'termux', to: 'ingestion' },
    { from: 'universal', to: 'cognitive' },
    { from: 'ingestion', to: 'discernment' },
    { from: 'alignment', to: 'dise' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Draw edges
      edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = 'rgba(90, 90, 112, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 22);
      });
    };

    draw();
  }, [nodes]);

  return React.createElement('canvas', { 
    ref: canvasRef, 
    style: { width: '100%', height: '100%', display: 'block' }
  });
};

const PipelineStage = ({ stage, isActive, isCompleted, isFailed }) => {
  let className = 'pipeline-stage';
  if (isActive) className += ' active';
  else if (isCompleted) className += ' completed';
  else if (isFailed) className += ' failed';

  return React.createElement('div', { className },
    React.createElement('div', { className: 'pipeline-stage-num' }, 
      String(stage.num).padStart(2, '0')
    ),
    React.createElement('div', { className: 'pipeline-stage-name' }, stage.name),
    React.createElement('div', { className: 'pipeline-stage-status' },
      isActive ? '● Running' : isCompleted ? '✓ Done' : isFailed ? '✗ Failed' : '○ Pending'
    )
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return React.createElement('div', { 
    className: `modal-overlay ${isOpen ? 'active' : ''}`,
    onClick: (e) => e.target === e.currentTarget && onClose()
  },
    React.createElement('div', { className: 'modal' },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
        React.createElement('h3', { className: 'modal-title' }, title),
        React.createElement('button', { 
          className: 'btn btn-ghost', 
          onClick: onClose,
          style: { padding: 4 }
        }, React.createElement(Icons.X))
      ),
      children
    )
  );
};

// ==================== PAGE: DASHBOARD ====================

const DashboardPage = ({ state, setState }) => {
  const activeProjects = state.projects.filter(p => p.status === 'active').length;
  const totalBuilds = state.projects.reduce((sum, p) => sum + p.builds, 0);
  const avgSuccess = Math.round(state.projects.reduce((sum, p) => sum + p.successRate, 0) / state.projects.length);
  const recentBuilds = state.builds.slice(0, 5);

  return React.createElement('div', null,
    // Hero Section
    React.createElement('div', { className: 'hero-section fade-in' },
      React.createElement('div', { className: 'hero-title' }, 'Synthia Build Station'),
      React.createElement('div', { className: 'hero-desc' },
        'Autonomous development command center. Your ideas, your work, your goals — automatically ingested, understood, aligned, and built into deployable reality. Every file you create becomes part of a living system that grows toward helping others succeed.'
      ),
      React.createElement('div', { className: 'hero-actions' },
        React.createElement('button', { 
          className: 'btn btn-primary',
          onClick: () => setState(s => ({ ...s, activePage: 'pipeline' }))
        }, React.createElement(Icons.Play), 'Start Build Pipeline'),
        React.createElement('button', { 
          className: 'btn',
          onClick: () => setState(s => ({ ...s, activePage: 'knowledge' }))
        }, React.createElement(Icons.Upload), 'Ingest Files'),
        React.createElement('button', { 
          className: 'btn btn-ghost',
          onClick: () => setState(s => ({ ...s, activePage: 'goals' }))
        }, React.createElement(Icons.Target), 'Review Goals')
      )
    ),

    // Stats Grid
    React.createElement('div', { className: 'grid-4 fade-in stagger-1' },
      React.createElement(StatCard, { 
        label: 'Active Projects', 
        value: activeProjects, 
        change: '+1 this week', 
        changeType: 'positive',
        icon: Icons.Box,
        color: 'var(--accent-cyan)'
      }),
      React.createElement(StatCard, { 
        label: 'Total Builds', 
        value: totalBuilds, 
        change: '+12 today', 
        changeType: 'positive',
        icon: Icons.GitBranch,
        color: 'var(--accent-blue)'
      }),
      React.createElement(StatCard, { 
        label: 'Success Rate', 
        value: `${avgSuccess}%`, 
        change: '+3%', 
        changeType: 'positive',
        icon: Icons.Shield,
        color: 'var(--accent-emerald)'
      }),
      React.createElement(StatCard, { 
        label: 'Knowledge Files', 
        value: state.knowledge.files, 
        change: '+10 ingested', 
        changeType: 'positive',
        icon: Icons.Brain,
        color: 'var(--accent-purple)'
      })
    ),

    // Main Content Grid
    React.createElement('div', { className: 'grid-2', style: { marginTop: 24 } },
      // Recent Builds
      React.createElement('div', { className: 'card fade-in stagger-2' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'card-title' }, 'Recent Builds'),
            React.createElement('div', { className: 'card-subtitle' }, 'Latest build activity across all projects')
          ),
          React.createElement('button', { 
            className: 'btn btn-ghost',
            onClick: () => setState(s => ({ ...s, activePage: 'projects' }))
          }, 'View All')
        ),
        React.createElement('table', { className: 'data-table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, 'Project'),
              React.createElement('th', null, 'Status'),
              React.createElement('th', null, 'Time'),
              React.createElement('th', null, 'Commit')
            )
          ),
          React.createElement('tbody', null,
            recentBuilds.map(build =>
              React.createElement('tr', { key: build.id },
                React.createElement('td', null, 
                  React.createElement('div', { style: { fontWeight: 600, color: 'var(--text-primary)' } }, build.project),
                  React.createElement('div', { style: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 } }, build.message)
                ),
                React.createElement('td', null,
                  build.status === 'success' ? React.createElement(Tag, { variant: 'emerald' }, 'Success') :
                  build.status === 'building' ? React.createElement(Tag, { variant: 'amber' }, 'Building') :
                  React.createElement(Tag, { variant: 'rose' }, 'Failed')
                ),
                React.createElement('td', null,
                  React.createElement('div', null, build.time),
                  React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)' } }, build.duration)
                ),
                React.createElement('td', null,
                  React.createElement('code', { style: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-cyan)' } }, build.commit)
                )
              )
            )
          )
        )
      ),

      // Knowledge Graph Preview
      React.createElement('div', { className: 'card fade-in stagger-3' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'card-title' }, 'Knowledge Graph'),
            React.createElement('div', { className: 'card-subtitle' }, `${state.knowledge.concepts} concepts, ${state.knowledge.relations} relations`)
          ),
          React.createElement('button', { 
            className: 'btn btn-ghost',
            onClick: () => setState(s => ({ ...s, activePage: 'knowledge' }))
          }, 'Explore')
        ),
        React.createElement('div', { className: 'knowledge-canvas' },
          React.createElement(KnowledgeGraph)
        )
      )
    ),

    // Bottom Row
    React.createElement('div', { className: 'grid-2', style: { marginTop: 24 } },
      // Active Pipeline
      React.createElement('div', { className: 'card fade-in stagger-4' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'card-title' }, 'Active Pipeline'),
            React.createElement('div', { className: 'card-subtitle' }, `${state.pipeline.currentProject} — Stage ${state.pipeline.currentStage}/10`)
          ),
          React.createElement('button', { 
            className: 'btn btn-ghost',
            onClick: () => setState(s => ({ ...s, activePage: 'pipeline' }))
          }, 'Details')
        ),
        React.createElement('div', { className: 'pipeline-container hide-scrollbar' },
          state.pipeline.stages.map(stage =>
            React.createElement(PipelineStage, {
              key: stage.num,
              stage,
              isActive: stage.num === state.pipeline.currentStage,
              isCompleted: stage.num < state.pipeline.currentStage,
              isFailed: stage.status === 'failed'
            })
          )
        )
      ),

      // Terminal Output
      React.createElement('div', { className: 'card fade-in stagger-5' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'card-title' }, 'Build Terminal'),
            React.createElement('div', { className: 'card-subtitle' }, 'Real-time build output')
          ),
          React.createElement('button', { 
            className: 'btn btn-ghost',
            onClick: () => setState(s => ({ ...s, activePage: 'terminal' }))
          }, 'Full View')
        ),
        React.createElement(Terminal, { lines: state.terminal.slice(-4) })
      )
    )
  );
};

// ==================== PAGE: PROJECTS ====================

const ProjectsPage = ({ state, setState }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);

  const projectBuilds = state.builds.filter(b => !selectedProject || b.project === selectedProject.name);

  return React.createElement('div', null,
    React.createElement('div', { className: 'section-header fade-in' },
      React.createElement('h1', { className: 'section-title' }, 'Projects'),
      React.createElement('p', { className: 'section-desc' }, 'Manage your autonomous build projects. Each project follows your guidelines and goals.')
    ),

    // Project Cards
    React.createElement('div', { className: 'grid-2', style: { marginBottom: 24 } },
      state.projects.map((project, i) =>
        React.createElement('div', { 
          key: project.id, 
          className: `card fade-in stagger-${i + 1}`,
          style: { 
            cursor: 'pointer',
            borderColor: selectedProject?.id === project.id ? 'var(--accent-cyan)' : undefined
          },
          onClick: () => setSelectedProject(selectedProject?.id === project.id ? null : project)
        },
          React.createElement('div', { className: 'card-header' },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
              React.createElement('div', { style: { 
                width: 40, height: 40, borderRadius: 10, 
                background: project.status === 'active' ? 'rgba(0, 212, 170, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${project.status === 'active' ? 'rgba(0, 212, 170, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
              }},
                React.createElement(project.status === 'active' ? Icons.Box : Icons.Activity)
              ),
              React.createElement('div', null,
                React.createElement('div', { style: { fontWeight: 700, fontSize: 16 } }, project.name),
                React.createElement('div', { style: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 } }, project.description)
              )
            ),
            React.createElement(Tag, { variant: project.status === 'active' ? 'emerald' : 'amber' }, 
              project.status === 'active' ? 'Active' : 'Building'
            )
          ),

          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 } },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 } }, 'Builds'),
              React.createElement('div', { style: { fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4 } }, project.builds)
            ),
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 } }, 'Success'),
              React.createElement('div', { style: { fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--accent-emerald)' } }, `${project.successRate}%`)
            ),
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 } }, 'Modules'),
              React.createElement('div', { style: { fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4 } }, project.modules)
            )
          ),

          React.createElement('div', { style: { marginTop: 16 } },
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8 } }, 'Stack'),
            React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
              project.stack.map((tech, j) => React.createElement(Tag, { key: j, variant: ['cyan', 'blue', 'purple', 'amber'][j % 4] }, tech))
            )
          ),

          selectedProject?.id === project.id && React.createElement('div', { style: { marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' } },
            React.createElement('div', { style: { fontSize: 14, fontWeight: 600, marginBottom: 12 } }, 'Goal'),
            React.createElement('p', { style: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 } }, project.goal),

            React.createElement('div', { style: { fontSize: 14, fontWeight: 600, marginBottom: 12 } }, 'Guidelines'),
            React.createElement('ul', { style: { listStyle: 'none', padding: 0 } },
              project.guidelines.map((g, k) =>
                React.createElement('li', { key: k, style: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' } },
                  React.createElement('span', { style: { color: 'var(--accent-cyan)', marginTop: 2 } }, '●'),
                  g
                )
              )
            ),

            React.createElement('div', { style: { display: 'flex', gap: 12, marginTop: 16 } },
              React.createElement('button', { className: 'btn btn-primary' }, 
                React.createElement(Icons.Play), 'Build Now'
              ),
              React.createElement('button', { className: 'btn' }, 
                React.createElement(Icons.RefreshCw), 'Rebuild'
              ),
              React.createElement('button', { className: 'btn btn-ghost' }, 
                React.createElement(Icons.Settings), 'Configure'
              )
            )
          )
        )
      )
    ),

    // Build History Table
    React.createElement('div', { className: 'card fade-in' },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Build History'),
          React.createElement('div', { className: 'card-subtitle' }, 
            selectedProject ? `Showing builds for ${selectedProject.name}` : 'All projects'
          )
        ),
        selectedProject && React.createElement('button', { 
          className: 'btn btn-ghost',
          onClick: () => setSelectedProject(null)
        }, 'Clear Filter')
      ),
      React.createElement('table', { className: 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'ID'),
            React.createElement('th', null, 'Project'),
            React.createElement('th', null, 'Status'),
            React.createElement('th', null, 'Time'),
            React.createElement('th', null, 'Duration'),
            React.createElement('th', null, 'Commit'),
            React.createElement('th', null, 'Message')
          )
        ),
        React.createElement('tbody', null,
          projectBuilds.map(build =>
            React.createElement('tr', { key: build.id },
              React.createElement('td', null, 
                React.createElement('code', { style: { fontFamily: 'var(--font-mono)', fontSize: 12 } }, `#${build.id}`)
              ),
              React.createElement('td', null, build.project),
              React.createElement('td', null,
                build.status === 'success' ? React.createElement(Tag, { variant: 'emerald' }, 'Success') :
                build.status === 'building' ? React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 6 } }, 
                  React.createElement('span', { className: 'spinner' }), 'Building'
                ) :
                React.createElement(Tag, { variant: 'rose' }, 'Failed')
              ),
              React.createElement('td', null, build.time),
              React.createElement('td', null, build.duration),
              React.createElement('td', null, 
                React.createElement('code', { style: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-cyan)' } }, build.commit)
              ),
              React.createElement('td', null, 
                React.createElement('span', { style: { fontSize: 13, color: 'var(--text-secondary)' } }, build.message)
              )
            )
          )
        )
      )
    )
  );
};

// ==================== PAGE: KNOWLEDGE ====================

const KnowledgePage = ({ state, setState }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredSources = state.knowledge.sources.filter(s => {
    if (filter === 'all') return true;
    return s.type.toLowerCase() === filter;
  }).filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const conceptCategories = [
    { name: 'Ingestion Systems', count: 12, color: 'var(--accent-cyan)' },
    { name: 'Discernment Engines', count: 8, color: 'var(--accent-purple)' },
    { name: 'Cognitive Physics', count: 15, color: 'var(--accent-blue)' },
    { name: 'Human Design', count: 23, color: 'var(--accent-amber)' },
    { name: 'Trust & Governance', count: 10, color: 'var(--accent-emerald)' },
    { name: 'Universal Grammar', count: 11, color: 'var(--accent-rose)' },
    { name: 'Biosemiotics', count: 6, color: 'var(--accent-cyan)' },
    { name: 'Termux Automation', count: 4, color: 'var(--accent-purple)' },
  ];

  return React.createElement('div', null,
    React.createElement('div', { className: 'section-header fade-in' },
      React.createElement('h1', { className: 'section-title' }, 'Knowledge Base'),
      React.createElement('p', { className: 'section-desc' }, 
        'Your ideas, ingested and understood. The system reads your files, extracts concepts, maps relations, and uses this knowledge to guide autonomous builds.'
      )
    ),

    // Stats
    React.createElement('div', { className: 'grid-4 fade-in stagger-1', style: { marginBottom: 24 } },
      React.createElement(StatCard, { label: 'Files Ingested', value: state.knowledge.files, icon: Icons.FileText, color: 'var(--accent-cyan)' }),
      React.createElement(StatCard, { label: 'Concepts Extracted', value: state.knowledge.concepts, icon: Icons.Brain, color: 'var(--accent-purple)' }),
      React.createElement(StatCard, { label: 'Relations Mapped', value: state.knowledge.relations, icon: Icons.GitBranch, color: 'var(--accent-blue)' }),
      React.createElement(StatCard, { label: 'Last Ingest', value: '2h ago', icon: Icons.Clock, color: 'var(--accent-amber)' })
    ),

    // Concept Categories
    React.createElement('div', { className: 'card fade-in stagger-2', style: { marginBottom: 24 } },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Concept Categories'),
          React.createElement('div', { className: 'card-subtitle' }, 'How your knowledge is organized')
        )
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 } },
        conceptCategories.map((cat, i) =>
          React.createElement('div', { 
            key: i, 
            style: { 
              padding: 16, 
              borderRadius: 10, 
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            },
            onMouseEnter: e => e.currentTarget.style.borderColor = cat.color,
            onMouseLeave: e => e.currentTarget.style.borderColor = 'var(--border-subtle)'
          },
            React.createElement('div', { style: { fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: cat.color } }, cat.count),
            React.createElement('div', { style: { fontSize: 13, fontWeight: 600, marginTop: 4 } }, cat.name),
            React.createElement('div', { style: { marginTop: 8, height: 3, borderRadius: 2, background: cat.color, opacity: 0.3 } })
          )
        )
      )
    ),

    // Knowledge Graph
    React.createElement('div', { className: 'card fade-in stagger-3', style: { marginBottom: 24 } },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Knowledge Graph Visualization'),
          React.createElement('div', { className: 'card-subtitle' }, 'Interactive map of your ideas and their relationships')
        )
      ),
      React.createElement('div', { className: 'knowledge-canvas' },
        React.createElement(KnowledgeGraph)
      )
    ),

    // Source Files
    React.createElement('div', { className: 'card fade-in stagger-4' },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Source Files'),
          React.createElement('div', { className: 'card-subtitle' }, 'Files that have been ingested into the knowledge base')
        ),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          React.createElement('input', {
            className: 'input-field',
            style: { width: 200 },
            placeholder: 'Search files...',
            value: searchQuery,
            onChange: e => setSearchQuery(e.target.value)
          }),
          React.createElement('select', {
            className: 'input-field',
            style: { width: 120 },
            value: filter,
            onChange: e => setFilter(e.target.value)
          },
            React.createElement('option', { value: 'all' }, 'All Types'),
            React.createElement('option', { value: 'typescript' }, 'TypeScript'),
            React.createElement('option', { value: 'javascript' }, 'JavaScript'),
            React.createElement('option', { value: 'python' }, 'Python')
          )
        )
      ),
      React.createElement('table', { className: 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'File Name'),
            React.createElement('th', null, 'Type'),
            React.createElement('th', null, 'Size'),
            React.createElement('th', null, 'Status')
          )
        ),
        React.createElement('tbody', null,
          filteredSources.map((source, i) =>
            React.createElement('tr', { key: i },
              React.createElement('td', null, 
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  React.createElement(Icons.FileText),
                  React.createElement('span', { style: { fontWeight: 500 } }, source.name)
                )
              ),
              React.createElement('td', null, 
                React.createElement(Tag, { variant: 'cyan' }, source.type)
              ),
              React.createElement('td', null, source.size),
              React.createElement('td', null, 
                React.createElement(Tag, { variant: 'emerald' }, source.status)
              )
            )
          )
        )
      )
    )
  );
};

// ==================== PAGE: GOALS ====================

const GoalsPage = ({ state, setState }) => {
  const [newGoal, setNewGoal] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const getDimensionColor = (dim) => {
    const colors = { D1: 'var(--accent-rose)', D2: 'var(--accent-amber)', D3: 'var(--accent-cyan)', D4: 'var(--accent-blue)', D5: 'var(--accent-purple)' };
    return colors[dim] || 'var(--accent-cyan)';
  };

  return React.createElement('div', null,
    React.createElement('div', { className: 'section-header fade-in' },
      React.createElement('h1', { className: 'section-title' }, 'Goals & Alignment'),
      React.createElement('p', { className: 'section-desc' }, 
        'Your goals drive the autonomous build system. Every build is aligned toward helping you reach success by helping others reach success.'
      )
    ),

    // 5D Dimensions
    React.createElement('div', { className: 'grid-5', style: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 } },
      [
        { num: 'D1', name: 'Impulse', desc: 'The raw signal — biological syntax, genetic encoding, amino acid sequences. The foundation of all meaning.' },
        { num: 'D2', name: 'Polarity', desc: 'Tension and opposition — yin/yang, attraction/repulsion, the force that creates structure from impulse.' },
        { num: 'D3', name: 'Witness', desc: 'The observer-node where J(D1,D2) creates experience. Not ego — the coordinate where the universe becomes self-measuring.' },
        { num: 'D4', name: 'Context', desc: 'The surrounding field that gives meaning to the witness. Historical, cultural, situational embedding.' },
        { num: 'D5', name: 'Meaning', desc: 'The emergent coherence. Purpose crystallized. The attractor that pulls all lower dimensions into alignment.' },
      ].map((d, i) =>
        React.createElement('div', { key: i, className: `dimension-card d${i + 1} fade-in stagger-${i + 1}` },
          React.createElement('div', { className: 'dimension-num' }, d.num),
          React.createElement('div', { className: 'dimension-name', style: { color: getDimensionColor(d.num) } }, d.name),
          React.createElement('div', { className: 'dimension-desc' }, d.desc)
        )
      )
    ),

    // Goals List
    React.createElement('div', { className: 'card fade-in' },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Active Goals'),
          React.createElement('div', { className: 'card-subtitle' }, `${state.goals.length} goals mapped to projects and dimensions`)
        ),
        React.createElement('button', { className: 'btn btn-primary', onClick: () => setShowAddModal(true) },
          React.createElement(Icons.Plus), 'Add Goal'
        )
      ),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
        state.goals.map((goal, i) =>
          React.createElement('div', { key: goal.id, style: {
            padding: 20,
            background: 'var(--bg-primary)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 20
          }},
            React.createElement('div', { style: { 
              width: 50, 
              height: 50, 
              borderRadius: '50%', 
              background: `${getDimensionColor(goal.dimension)}20`,
              border: `2px solid ${getDimensionColor(goal.dimension)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              color: getDimensionColor(goal.dimension),
              fontFamily: 'var(--font-mono)',
              flexShrink: 0
            }}, goal.dimension),

            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 } },
                React.createElement('span', { style: { fontWeight: 600, fontSize: 15 } }, goal.text),
                React.createElement(Tag, { variant: goal.priority === 'high' ? 'rose' : 'amber' }, goal.priority)
              ),
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
                React.createElement('span', { style: { fontSize: 13, color: 'var(--text-muted)' } }, `Project: ${goal.project}`),
                React.createElement('span', { style: { fontSize: 13, color: 'var(--text-muted)' } }, `Progress: ${goal.progress}%`)
              ),
              React.createElement('div', { className: 'progress-bar', style: { marginTop: 8 } },
                React.createElement('div', { 
                  className: 'progress-fill cyan', 
                  style: { width: `${goal.progress}%`, background: getDimensionColor(goal.dimension) } 
                })
              )
            ),

            React.createElement('div', { style: { 
              width: 60, 
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: 20,
              color: getDimensionColor(goal.dimension)
            }}, `${goal.progress}%`)
          )
        )
      )
    ),

    // Guidelines Section
    React.createElement('div', { className: 'card fade-in', style: { marginTop: 24 } },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Build Guidelines'),
          React.createElement('div', { className: 'card-subtitle' }, 'Principles that govern every autonomous decision')
        )
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 } },
        state.guidelines.map((g, i) =>
          React.createElement('div', { key: g.id, style: {
            padding: 16,
            background: 'var(--bg-primary)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }},
            React.createElement('div', { style: { 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: 'var(--accent-cyan)', 
              marginTop: 6,
              flexShrink: 0 
            }}),
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 14, fontWeight: 500, marginBottom: 4 } }, g.text),
              React.createElement('div', { style: { fontSize: 12, color: 'var(--text-muted)' } }, 
                `Category: ${g.category} • Projects: ${g.projects.join(', ')}`
              )
            )
          )
        )
      )
    ),

    // Add Goal Modal
    React.createElement(Modal, {
      isOpen: showAddModal,
      onClose: () => setShowAddModal(false),
      title: 'Add New Goal'
    },
      React.createElement('p', { className: 'modal-desc' }, 'Define a new goal that the autonomous build system will work toward.'),
      React.createElement('textarea', {
        className: 'input-field',
        placeholder: 'Describe your goal...',
        value: newGoal,
        onChange: e => setNewGoal(e.target.value),
        style: { marginBottom: 16 }
      }),
      React.createElement('div', { style: { display: 'flex', gap: 12, justifyContent: 'flex-end' } },
        React.createElement('button', { className: 'btn btn-ghost', onClick: () => setShowAddModal(false) }, 'Cancel'),
        React.createElement('button', { 
          className: 'btn btn-primary',
          onClick: () => {
            if (newGoal.trim()) {
              setState(s => ({
                ...s,
                goals: [...s.goals, { 
                  id: s.goals.length + 1, 
                  text: newGoal, 
                  priority: 'medium', 
                  progress: 0, 
                  project: 'Unassigned', 
                  dimension: 'D5' 
                }]
              }));
              setNewGoal('');
              setShowAddModal(false);
            }
          }
        }, 'Add Goal')
      )
    )
  );
};

// ==================== PAGE: PIPELINE ====================

const PipelinePage = ({ state, setState }) => {
  const pipeline = state.pipeline;
  const activeStage = pipeline.stages[pipeline.currentStage - 1];

  const stageDetails = {
    1: { inputs: 'Source files, git repos, URLs', outputs: 'Validated file manifest, checksums', agent: 'IngestionAgent' },
    2: { inputs: 'File manifest', outputs: 'Concept extraction, AST parse, dependency graph', agent: 'AnalysisAgent' },
    3: { inputs: 'Extracted concepts', outputs: 'Knowledge graph nodes & edges', agent: 'UnderstandingAgent' },
    4: { inputs: 'Knowledge graph + Goals', outputs: 'Alignment score, priority mapping', agent: 'AlignmentAgent' },
    5: { inputs: 'Aligned goals + Guidelines', outputs: 'Architecture spec, component list', agent: 'DesignAgent' },
    6: { inputs: 'Architecture spec', outputs: 'Source code, tests, configs', agent: 'BuildAgent' },
    7: { inputs: 'Source code', outputs: 'Test results, coverage report', agent: 'VerifyAgent' },
    8: { inputs: 'Verified code', outputs: 'Deployed artifacts, URLs', agent: 'DeployAgent' },
    9: { inputs: 'Deployed artifacts', outputs: 'Metrics, logs, health status', agent: 'MonitorAgent' },
    10: { inputs: 'Metrics + Feedback', outputs: 'Lessons learned, skill updates', agent: 'EvolveAgent' },
  };

  const currentDetail = stageDetails[pipeline.currentStage] || {};

  return React.createElement('div', null,
    React.createElement('div', { className: 'section-header fade-in' },
      React.createElement('h1', { className: 'section-title' }, 'Build Pipeline'),
      React.createElement('p', { className: 'section-desc' }, 
        `Currently building: ${pipeline.currentProject} — Stage ${pipeline.currentStage}/10`
      )
    ),

    // Pipeline Stages
    React.createElement('div', { className: 'card fade-in stagger-1', style: { marginBottom: 24 } },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Pipeline Stages'),
          React.createElement('div', { className: 'card-subtitle' }, '10-stage autonomous build process')
        ),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          React.createElement('button', { className: 'btn' }, React.createElement(Icons.Pause), 'Pause'),
          React.createElement('button', { className: 'btn btn-primary' }, React.createElement(Icons.Play), 'Resume')
        )
      ),
      React.createElement('div', { className: 'pipeline-container hide-scrollbar' },
        pipeline.stages.map(stage =>
          React.createElement(PipelineStage, {
            key: stage.num,
            stage,
            isActive: stage.num === pipeline.currentStage,
            isCompleted: stage.num < pipeline.currentStage,
            isFailed: stage.status === 'failed'
          })
        )
      )
    ),

    // Active Stage Detail
    React.createElement('div', { className: 'grid-2 fade-in stagger-2' },
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'card-title' }, `Stage ${pipeline.currentStage}: ${activeStage?.name}`),
            React.createElement('div', { className: 'card-subtitle' }, activeStage?.desc)
          )
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 } }, 'Agent'),
            React.createElement('div', { style: { fontSize: 14, fontWeight: 600 } }, currentDetail.agent || '—')
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 } }, 'Inputs'),
            React.createElement('div', { style: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 } }, currentDetail.inputs || '—')
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 } }, 'Outputs'),
            React.createElement('div', { style: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 } }, currentDetail.outputs || '—')
          ),
          React.createElement('div', { style: { marginTop: 8 } },
            React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8 } }, 'Progress'),
            React.createElement('div', { className: 'progress-bar' },
              React.createElement('div', { className: 'progress-fill cyan', style: { width: '65%' } })
            ),
            React.createElement('div', { style: { fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' } }, '65% complete')
          )
        )
      ),

      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'card-title' }, 'Live Output'),
            React.createElement('div', { className: 'card-subtitle' }, 'Real-time build logs')
          )
        ),
        React.createElement(Terminal, { lines: [
          { type: 'info', text: `Starting Stage ${pipeline.currentStage}: ${activeStage?.name}` },
          { type: 'info', text: `Loading agent: ${currentDetail.agent}` },
          { type: 'success', text: 'Inputs validated — 3 files, 0 errors' },
          { type: 'info', text: 'Processing with D5-meaning alignment...' },
          { type: 'warn', text: 'Guideline check: "Scientific rigor over flashy" — passed' },
          { type: 'info', text: 'Generating architecture spec...' },
          { type: 'success', text: 'Architecture spec generated — 12 components' },
          { type: 'info', text: 'Waiting for next stage trigger...' },
        ]})
      )
    ),

    // Stage History
    React.createElement('div', { className: 'card fade-in stagger-3', style: { marginTop: 24 } },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Stage History'),
          React.createElement('div', { className: 'card-subtitle' }, 'Previous pipeline runs and their outcomes')
        )
      ),
      React.createElement('table', { className: 'data-table' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'Run ID'),
            React.createElement('th', null, 'Project'),
            React.createElement('th', null, 'Stages'),
            React.createElement('th', null, 'Status'),
            React.createElement('th', null, 'Duration'),
            React.createElement('th', null, 'Started')
          )
        ),
        React.createElement('tbody', null,
          [
            { id: '#247', project: 'Living Mirror', stages: '5/10', status: 'running', duration: '12m 34s', started: '21:30' },
            { id: '#246', project: 'MRNN Engine', stages: '10/10', status: 'success', duration: '8m 12s', started: '20:15' },
            { id: '#245', project: 'Synthia OS', stages: '10/10', status: 'success', duration: '15m 45s', started: '18:42' },
            { id: '#244', project: 'Synthia OS', stages: '7/10', status: 'failed', duration: '9m 23s', started: '16:10' },
            { id: '#243', project: 'Termux MCP', stages: '10/10', status: 'success', duration: '5m 18s', started: '14:20' },
          ].map((run, i) =>
            React.createElement('tr', { key: i },
              React.createElement('td', null, React.createElement('code', { style: { fontFamily: 'var(--font-mono)', fontSize: 12 } }, run.id)),
              React.createElement('td', null, run.project),
              React.createElement('td', null, run.stages),
              React.createElement('td', null,
                run.status === 'success' ? React.createElement(Tag, { variant: 'emerald' }, 'Success') :
                run.status === 'running' ? React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 6 } }, React.createElement('span', { className: 'spinner' }), 'Running') :
                React.createElement(Tag, { variant: 'rose' }, 'Failed')
              ),
              React.createElement('td', null, run.duration),
              React.createElement('td', null, run.started)
            )
          )
        )
      )
    )
  );
};

// ==================== PAGE: TERMINAL ====================

const TerminalPage = ({ state, setState }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState(state.terminal);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e) => {
    if (e.key === 'Enter' && command.trim()) {
      const cmd = command.trim();
      let response = { type: 'info', text: `Command not recognized: ${cmd}` };

      if (cmd === 'help') {
        response = { type: 'success', text: 'Available commands: help, status, build, ingest, goals, clear' };
      } else if (cmd === 'status') {
        response = { type: 'success', text: 'System operational. 4 projects active. Pipeline running on Living Mirror Stage 5.' };
      } else if (cmd === 'build') {
        response = { type: 'info', text: 'Initiating autonomous build sequence...' };
        setTimeout(() => {
          setHistory(h => [...h, { type: 'success', text: 'Build started for Living Mirror' }]);
        }, 1000);
      } else if (cmd === 'ingest') {
        response = { type: 'info', text: 'Scanning for new files to ingest...' };
        setTimeout(() => {
          setHistory(h => [...h, { type: 'success', text: 'Ingested 3 new files. Concepts updated.' }]);
        }, 1500);
      } else if (cmd === 'goals') {
        response = { type: 'success', text: '6 active goals. Top priority: Integrate Roxy API into Living Mirror (45% complete).' };
      } else if (cmd === 'clear') {
        setHistory([]);
        setCommand('');
        return;
      }

      setHistory([...history, { type: 'prompt', text: cmd }, response]);
      setCommand('');
    }
  };

  return React.createElement('div', null,
    React.createElement('div', { className: 'section-header fade-in' },
      React.createElement('h1', { className: 'section-title' }, 'Build Terminal'),
      React.createElement('p', { className: 'section-desc' }, 'Interactive command interface for the autonomous build system.')
    ),

    React.createElement('div', { className: 'card fade-in' },
      React.createElement('div', { className: 'terminal', style: { height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' } },
        React.createElement('div', { className: 'terminal-header' },
          React.createElement('div', { className: 'terminal-dot red' }),
          React.createElement('div', { className: 'terminal-dot yellow' }),
          React.createElement('div', { className: 'terminal-dot green' }),
          React.createElement('span', { style: { marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' } }, 'synthia-build@station:~')
        ),
        React.createElement('div', { className: 'terminal-body', style: { flex: 1, overflowY: 'auto' } },
          history.map((line, i) =>
            line.type === 'prompt' 
              ? React.createElement('div', { key: i, className: 'terminal-line' },
                  React.createElement('span', { className: 'prompt' }, '$ '),
                  line.text
                )
              : React.createElement('div', { key: i, className: `terminal-line ${line.type}` },
                  React.createElement('span', { className: 'prompt' }, '> '),
                  line.text
                )
          ),
          React.createElement('div', { ref: terminalEndRef })
        ),
        React.createElement('div', { style: { 
          padding: '12px 16px', 
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }},
          React.createElement('span', { style: { color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' } }, '$'),
          React.createElement('input', {
            style: {
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              outline: 'none'
            },
            placeholder: 'Type a command (help, status, build, ingest, goals, clear)...',
            value: command,
            onChange: e => setCommand(e.target.value),
            onKeyDown: handleCommand,
            autoFocus: true
          })
        )
      )
    ),

    React.createElement('div', { className: 'card fade-in', style: { marginTop: 16 } },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Quick Commands'),
          React.createElement('div', { className: 'card-subtitle' }, 'Click to execute')
        )
      ),
      React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
        ['help', 'status', 'build', 'ingest', 'goals', 'clear'].map(cmd =>
          React.createElement('button', {
            key: cmd,
            className: 'btn',
            onClick: () => {
              setCommand(cmd);
              handleCommand({ key: 'Enter', preventDefault: () => {} });
            }
          }, cmd)
        )
      )
    )
  );
};

// ==================== PAGE: SETTINGS ====================

const SettingsPage = ({ state, setState }) => {
  return React.createElement('div', null,
    React.createElement('div', { className: 'section-header fade-in' },
      React.createElement('h1', { className: 'section-title' }, 'Settings'),
      React.createElement('p', { className: 'section-desc' }, 'Configure the autonomous build system to match your workflow and preferences.')
    ),

    React.createElement('div', { className: 'grid-2 fade-in' },
      // Build Configuration
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'card-title' }, 'Build Configuration'),
            React.createElement('div', { className: 'card-subtitle' }, 'How the system builds and deploys')
          )
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 } }, 'Default Deploy Target'),
            React.createElement('select', { className: 'input-field' },
              React.createElement('option', null, 'Netlify'),
              React.createElement('option', null, 'Vercel'),
              React.createElement('option', null, 'GitHub Pages'),
              React.createElement('option', null, 'Supabase'),
              React.createElement('option', null, 'Self-hosted')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 } }, 'Auto-Build Trigger'),
            React.createElement('select', { className: 'input-field' },
              React.createElement('option', null, 'On file change'),
              React.createElement('option', null, 'On git push'),
              React.createElement('option', null, 'Manual only'),
              React.createElement('option', null, 'Scheduled (daily)')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 } }, 'Quality Threshold'),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
              React.createElement('input', { type: 'range', min: 0, max: 100, defaultValue: 85, style: { flex: 1 } }),
              React.createElement('span', { style: { fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: 40 } }, '85%')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' } },
              React.createElement('input', { type: 'checkbox', defaultChecked: true, style: { width: 18, height: 18 } }),
              React.createElement('span', { style: { fontSize: 14 } }, 'Auto-repair failed builds')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' } },
              React.createElement('input', { type: 'checkbox', defaultChecked: true, style: { width: 18, height: 18 } }),
              React.createElement('span', { style: { fontSize: 14 } }, 'Apply guidelines to all builds')
            )
          )
        )
      ),

      // Knowledge Configuration
      React.createElement('div', { className: 'card' },
        React.createElement('div', { className: 'card-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'card-title' }, 'Knowledge Configuration'),
            React.createElement('div', { className: 'card-subtitle' }, 'How the system ingests and understands your work')
          )
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 } }, 'Watch Directories'),
            React.createElement('textarea', { 
              className: 'input-field', 
              style: { minHeight: 80, fontFamily: 'var(--font-mono)', fontSize: 12 },
              defaultValue: '/workspace/synthia/src
/workspace/synthia/docs
/workspace/mrnn'
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 } }, 'Ingestion Mode'),
            React.createElement('select', { className: 'input-field' },
              React.createElement('option', null, 'Deep analysis (slower, more accurate)'),
              React.createElement('option', null, 'Fast scan (quick, surface-level)'),
              React.createElement('option', null, 'Hybrid (adaptive)')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 } }, 'Concept Extraction Depth'),
            React.createElement('select', { className: 'input-field' },
              React.createElement('option', null, 'Full semantic (functions, classes, comments, docs)'),
              React.createElement('option', null, 'API surface only (exports, interfaces)'),
              React.createElement('option', null, 'File-level only')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' } },
              React.createElement('input', { type: 'checkbox', defaultChecked: true, style: { width: 18, height: 18 } }),
              React.createElement('span', { style: { fontSize: 14 } }, 'Auto-relate new concepts to existing knowledge')
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' } },
              React.createElement('input', { type: 'checkbox', defaultChecked: false, style: { width: 18, height: 18 } }),
              React.createElement('span', { style: { fontSize: 14 } }, 'Include test files in knowledge graph')
            )
          )
        )
      )
    ),

    // Guidelines Editor
    React.createElement('div', { className: 'card fade-in', style: { marginTop: 24 } },
      React.createElement('div', { className: 'card-header' },
        React.createElement('div', null,
          React.createElement('div', { className: 'card-title' }, 'Guidelines Editor'),
          React.createElement('div', { className: 'card-subtitle' }, 'Edit the principles that govern every build decision')
        )
      ),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        state.guidelines.map((g, i) =>
          React.createElement('div', { key: g.id, style: { display: 'flex', gap: 12, alignItems: 'flex-start' } },
            React.createElement('input', { 
              className: 'input-field', 
              defaultValue: g.text,
              style: { flex: 1 }
            }),
            React.createElement('select', { className: 'input-field', style: { width: 140 } },
              React.createElement('option', null, 'trust'),
              React.createElement('option', null, 'governance'),
              React.createElement('option', null, 'cognition'),
              React.createElement('option', null, 'quality'),
              React.createElement('option', null, 'behavior'),
              React.createElement('option', null, 'philosophy')
            ),
            React.createElement('button', { className: 'btn btn-ghost', style: { padding: '8px' } }, 
              React.createElement(Icons.X)
            )
          )
        ),
        React.createElement('button', { className: 'btn', style: { marginTop: 8 } },
          React.createElement(Icons.Plus), 'Add Guideline'
        )
      )
    ),

    // Save Button
    React.createElement('div', { style: { marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 } },
      React.createElement('button', { className: 'btn btn-ghost' }, 'Reset to Defaults'),
      React.createElement('button', { className: 'btn btn-primary' }, 
        React.createElement(Icons.Check), 'Save Changes'
      )
    )
  );
};

// ==================== MAIN APP ====================

const App = () => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('synthia-build-state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('synthia-build-state', JSON.stringify(state));
  }, [state]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
    { id: 'projects', label: 'Projects', icon: Icons.Box },
    { id: 'knowledge', label: 'Knowledge Base', icon: Icons.Brain },
    { id: 'goals', label: 'Goals', icon: Icons.Target },
    { id: 'pipeline', label: 'Pipeline', icon: Icons.GitBranch },
    { id: 'terminal', label: 'Terminal', icon: Icons.Terminal },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  const pageTitles = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    knowledge: 'Knowledge Base',
    goals: 'Goals & Alignment',
    pipeline: 'Build Pipeline',
    terminal: 'Build Terminal',
    settings: 'Settings',
  };

  const renderPage = () => {
    switch (state.activePage) {
      case 'dashboard': return React.createElement(DashboardPage, { state, setState });
      case 'projects': return React.createElement(ProjectsPage, { state, setState });
      case 'knowledge': return React.createElement(KnowledgePage, { state, setState });
      case 'goals': return React.createElement(GoalsPage, { state, setState });
      case 'pipeline': return React.createElement(PipelinePage, { state, setState });
      case 'terminal': return React.createElement(TerminalPage, { state, setState });
      case 'settings': return React.createElement(SettingsPage, { state, setState });
      default: return React.createElement(DashboardPage, { state, setState });
    }
  };

  return React.createElement('div', { className: 'app-container' },
    // Sidebar
    React.createElement('aside', { className: `sidebar ${sidebarOpen ? 'open' : ''}` },
      React.createElement('div', { className: 'sidebar-header' },
        React.createElement('div', { className: 'logo' },
          React.createElement('div', { className: 'logo-icon' }, '◈'),
          React.createElement('div', null,
            React.createElement('div', { className: 'logo-text' }, 'SYNTHIA'),
            React.createElement('div', { className: 'logo-sub' }, 'Build Station')
          )
        )
      ),
      React.createElement('nav', { className: 'nav-section' },
        React.createElement('div', { className: 'nav-group-label' }, 'Command Center'),
        navItems.map(item =>
          React.createElement('button', {
            key: item.id,
            className: `nav-item ${state.activePage === item.id ? 'active' : ''}`,
            onClick: () => {
              setState(s => ({ ...s, activePage: item.id }));
              setSidebarOpen(false);
            }
          },
            React.createElement('span', { className: 'nav-icon' }, React.createElement(item.icon)),
            item.label,
            item.id === 'terminal' && state.terminal.length > 8 && React.createElement('span', { className: 'nav-badge' }, '!')
          )
        )
      ),
      React.createElement('div', { className: 'sidebar-footer' },
        React.createElement('div', { className: 'status-indicator' },
          React.createElement('span', { className: 'status-dot' }),
          'System Operational'
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--text-muted)', marginTop: 8 } },
          'v2.0.0 • Autonomous Mode'
        )
      )
    ),

    // Main Content
    React.createElement('main', { className: 'main-content' },
      // Top Bar
      React.createElement('header', { className: 'top-bar' },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
          React.createElement('button', { 
            className: 'mobile-toggle',
            onClick: () => setSidebarOpen(!sidebarOpen)
          }, React.createElement(Icons.Menu)),
          React.createElement('div', { className: 'breadcrumb' },
            React.createElement('span', null, 'Synthia'),
            React.createElement(Icons.ChevronRight),
            React.createElement('span', { className: 'breadcrumb-current' }, pageTitles[state.activePage])
          )
        ),
        React.createElement('div', { className: 'top-actions' },
          React.createElement('button', { className: 'btn btn-ghost tooltip', 'data-tip': 'Notifications' },
            React.createElement(Icons.Bell),
            state.notifications > 0 && React.createElement('span', { style: {
              position: 'absolute',
              top: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--accent-rose)',
              color: 'white',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}, state.notifications)
          ),
          React.createElement('button', { 
            className: 'btn btn-primary',
            onClick: () => setState(s => ({ ...s, activePage: 'pipeline' }))
          }, React.createElement(Icons.Play), 'Build')
        )
      ),

      // Page Content
      React.createElement('div', { className: 'page-content' },
        renderPage()
      )
    )
  );
};

// ==================== RENDER ====================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
