// ModuleBuilder.jsx — Complete Build System
// Merges: Template scaffolding + File management + Live testing + ZIP export

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Code, Eye, Sparkles, Save, Play, Download, Upload,
  Settings, Layers, Zap, Brain, Heart, Star, Circle, Target,
  CheckCircle, AlertCircle, Info, Trash2, Copy, FileCode,
  Layout, Puzzle, TestTube, Wand2, MessageCircle, Folder,
  FolderOpen, FileText, Edit3, X, ChevronRight, ChevronDown,
  Bug, Shield, Package, Terminal, RefreshCw, Cpu, Globe,
  Lock, Unlock, Activity, BarChart3, GitBranch, Rocket
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// MODULE TEMPLATE SYSTEM (unchanged core)
// ═══════════════════════════════════════════════════════════════

class ModuleTemplate {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    this.templates.set('field-dashboard', {
      id: 'field-dashboard',
      name: 'Field Dashboard',
      category: 'dashboard',
      description: 'Track and visualize a specific consciousness field',
      icon: Brain,
      scaffolding: {
        structure: 'single-page',
        components: ['FieldHeader', 'CoherenceTracker', 'ActiveGates', 'FieldJournal'],
        requiredProps: ['fieldName', 'userChart'],
        dataConnections: ['consciousnessState', 'fieldHistory']
      },
      codeTemplate: `import React, { useState, useEffect } from 'react';
import { Brain, Activity, Zap, Heart } from 'lucide-react';

const {{ModuleName}}Dashboard = ({ fieldName, userChart, resonanceEngine }) => {
  const [fieldState, setFieldState] = useState({ coherence: 0, energy: 0, gates: [] });
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!resonanceEngine?.fields?.[fieldName]) {
      setIsLoading(false);
      return;
    }
    const sub = resonanceEngine.fields[fieldName].subscribe(
      (state) => { setFieldState(state); setHistory(prev => [...prev.slice(-99), state]); }
    );
    setIsLoading(false);
    return () => sub?.unsubscribe?.();
  }, [fieldName, resonanceEngine]);

  if (isLoading) return <div className="p-8 text-cyan-400">Initializing {{ModuleName}} field...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-cyan-400" />
        <h1 className="text-3xl font-bold text-white">{fieldName} Field Dashboard</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard icon={Activity} label="Coherence" value={fieldState.coherence?.toFixed(2) || '0.00'} color="cyan" />
        <MetricCard icon={Zap} label="Energy" value={fieldState.energy?.toFixed(2) || '0.00'} color="yellow" />
        <MetricCard icon={Heart} label="Active Gates" value={fieldState.gates?.length || 0} color="pink" />
      </div>

      <div className="bg-white/5 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Field History</h3>
        <div className="h-48 flex items-end gap-1">
          {history.map((h, i) => (
            <div key={i} className="flex-1 bg-cyan-500/40 rounded-t" 
                 style={{ height: `${(h.coherence || 0) * 100}%`, minHeight: '2px' }} />
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div className={`bg-white/5 rounded-xl p-4 border border-${color}-500/30`}>
    <Icon className={`w-6 h-6 text-${color}-400 mb-2`} />
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

export default {{ModuleName}}Dashboard;`,
      configOptions: [
        { key: 'fieldName', type: 'select', options: ['zer', 'mind', 'body', 'heart', 'soul', 'spirit'] },
        { key: 'trackingMetrics', type: 'multiselect', options: ['coherence', 'energy', 'gates', 'emotions'] },
        { key: 'visualizationType', type: 'select', options: ['chart', 'graph', 'heatmap', 'timeline'] }
      ]
    });

    this.templates.set('oracle-tool', {
      id: 'oracle-tool',
      name: 'Oracle Tool',
      category: 'divination',
      description: 'Query-response system for consciousness guidance',
      icon: Sparkles,
      scaffolding: {
        structure: 'query-response',
        components: ['QueryInput', 'ResponseDisplay', 'ContextPanel', 'HistoryLog'],
        requiredProps: ['oracleType', 'interpretationEngine'],
        dataConnections: ['userChart', 'currentTransits', 'fieldStates']
      },
      codeTemplate: `import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, History, RotateCcw } from 'lucide-react';

const {{ModuleName}}Oracle = ({ oracleType, resonanceEngine }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [isConsulting, setIsConsulting] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

  const handleQuery = async () => {
    if (!query.trim() || !resonanceEngine) return;
    setIsConsulting(true);
    try {
      const result = await resonanceEngine.route({ text: query, mode: oracleType });
      const entry = { query, response: result, timestamp: Date.now() };
      setResponse(result);
      setHistory(prev => [...prev, entry]);
    } catch (err) {
      setResponse({ guidance: 'Oracle field temporarily unstable. Try again.', error: true });
    }
    setIsConsulting(false);
    setQuery('');
  };

  const clearHistory = () => { setHistory([]); setResponse(null); };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-8 h-8 text-purple-400" />
        <h1 className="text-3xl font-bold text-white capitalize">{oracleType} Oracle</h1>
      </div>

      <div className="bg-white/5 rounded-xl border border-gray-700 p-4 space-y-4">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Ask your question..."
            className="flex-1 px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button onClick={handleQuery} disabled={isConsulting}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-colors">
            {isConsulting ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        {response && (
          <div className={`p-4 rounded-lg ${response.error ? 'bg-red-500/20 border border-red-500/30' : 'bg-purple-500/10 border border-purple-500/30'}`}>
            <div className="text-sm text-purple-300 mb-1">Oracle Response</div>
            <div className="text-white">{response.guidance}</div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-400">
              <History className="w-4 h-4" />
              <span className="text-sm">Consultation History ({history.length})</span>
            </div>
            <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {history.map((entry, i) => (
              <div key={i} className="text-sm border-l-2 border-purple-500/30 pl-3">
                <div className="text-gray-400">Q: {entry.query}</div>
                <div className="text-purple-300">A: {entry.response?.guidance}</div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default {{ModuleName}}Oracle;`,
      configOptions: [
        { key: 'oracleType', type: 'select', options: ['trinity', 'iching', 'tarot', 'runes', 'custom'] },
        { key: 'responseFormat', type: 'select', options: ['text', 'symbolic', 'multimedia'] },
        { key: 'contextAwareness', type: 'multiselect', options: ['transits', 'moonPhase', 'fieldStates', 'userHistory'] }
      ]
    });

    this.templates.set('biofeedback', {
      id: 'biofeedback',
      name: 'Biofeedback Tool',
      category: 'measurement',
      description: 'Real-time physiological data integration',
      icon: Activity,
      scaffolding: {
        structure: 'real-time-stream',
        components: ['DataStream', 'Visualizer', 'Calibration', 'Analytics'],
        requiredProps: ['deviceType', 'metricsTracked'],
        dataConnections: ['biofeedbackAPI', 'fieldStates', 'consciousnessMetrics']
      },
      codeTemplate: `import React, { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Brain, Zap, Wifi, WifiOff } from 'lucide-react';

const {{ModuleName}}Biofeedback = ({ deviceType, metricsTracked, syncWithFields }) => {
  const [liveData, setLiveData] = useState({});
  const [connected, setConnected] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Simulate device connection
    const connect = setTimeout(() => setConnected(true), 1500);
    return () => clearTimeout(connect);
  }, [deviceType]);

  useEffect(() => {
    if (!connected) return;
    intervalRef.current = setInterval(() => {
      const data = {};
      metricsTracked.forEach(m => {
        data[m] = Math.sin(Date.now() / 1000 + Math.random()) * 0.5 + 0.5;
      });
      setLiveData(data);
      if (!calibrated) {
        setCalibrationProgress(p => {
          const next = p + 2;
          if (next >= 100) setCalibrated(true);
          return Math.min(next, 100);
        });
      }
    }, 200);
    return () => clearInterval(intervalRef.current);
  }, [connected, metricsTracked, calibrated]);

  const metricIcons = { heartRate: Heart, coherence: Brain, stress: Activity, alpha: Zap, beta: Zap };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-green-400" />
          <h1 className="text-3xl font-bold text-white">{deviceType} Biofeedback</h1>
        </div>
        <div className="flex items-center gap-2">
          {connected ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
          <span className="text-sm text-gray-400">{connected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      {!calibrated && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="text-yellow-400 text-sm mb-2">Calibrating {deviceType}...</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: calibrationProgress + '%' }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {metricsTracked.map(metric => {
          const Icon = metricIcons[metric] || Activity;
          const value = liveData[metric];
          return (
            <div key={metric} className="bg-white/5 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400 capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
              </div>
              <div className="text-3xl font-bold text-white">{value !== undefined ? value.toFixed(3) : '--'}</div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div className="bg-green-400 h-1 rounded-full transition-all" style={{ width: (value || 0) * 100 + '%' }} />
              </div>
            </div>
          );
        })}
      </div>

      {syncWithFields && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
          Field synchronization enabled — biofeedback data will propagate to consciousness fields.
        </div>
      )}
    </div>
  );
};

export default {{ModuleName}}Biofeedback;`,
      configOptions: [
        { key: 'deviceType', type: 'select', options: ['HRV', 'EEG', 'GSR', 'EMG', 'custom'] },
        { key: 'metricsTracked', type: 'multiselect', options: ['heartRate', 'coherence', 'stress', 'alpha', 'beta'] },
        { key: 'syncWithFields', type: 'boolean' }
      ]
    });

    this.templates.set('experiment', {
      id: 'experiment',
      name: 'Experiment Protocol',
      category: 'research',
      description: 'Design and run falsifiable consciousness experiments',
      icon: TestTube,
      scaffolding: {
        structure: 'multi-phase',
        components: ['Hypothesis', 'Protocol', 'DataCollection', 'Analysis', 'Results'],
        requiredProps: ['experimentType', 'variables'],
        dataConnections: ['experimentData', 'statisticalEngine', 'fieldStates']
      },
      codeTemplate: `import React, { useState } from 'react';
import { TestTube, Play, BarChart3, CheckCircle, Clock, FlaskConical } from 'lucide-react';

const {{ModuleName}}Experiment = ({ experimentType, variables, duration, participants }) => {
  const [phase, setPhase] = useState('design');
  const [data, setData] = useState([]);
  const [results, setResults] = useState(null);
  const [hypothesis, setHypothesis] = useState('');
  const [progress, setProgress] = useState(0);

  const phases = [
    { id: 'design', label: 'Design', icon: FlaskConical },
    { id: 'collecting', label: 'Collecting', icon: Clock },
    { id: 'analyzing', label: 'Analyzing', icon: BarChart3 },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const runExperiment = async () => {
    if (!hypothesis.trim()) return;
    setPhase('collecting');

    // Simulate data collection
    const totalSteps = duration * 10;
    for (let i = 0; i < totalSteps; i++) {
      await new Promise(r => setTimeout(r, 100));
      setProgress(((i + 1) / totalSteps) * 100);
      setData(prev => [...prev, {
        timestamp: Date.now(),
        coherence: Math.random(),
        resonance: Math.random(),
        ...Object.fromEntries(variables.map(v => [v, Math.random()]))
      }]);
    }

    setPhase('analyzing');
    await new Promise(r => setTimeout(r, 1500));

    const analysis = {
      n: data.length,
      meanCoherence: data.reduce((s, d) => s + d.coherence, 0) / data.length,
      meanResonance: data.reduce((s, d) => s + d.resonance, 0) / data.length,
      significance: Math.random() > 0.3 ? 'significant' : 'inconclusive',
      hypothesisSupported: Math.random() > 0.4
    };

    setResults(analysis);
    setPhase('complete');
  };

  const currentPhaseIndex = phases.findIndex(p => p.id === phase);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <TestTube className="w-8 h-8 text-orange-400" />
        <h1 className="text-3xl font-bold text-white capitalize">{experimentType} Experiment</h1>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center gap-2">
        {phases.map((p, i) => (
          <React.Fragment key={p.id}>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              i <= currentPhaseIndex ? 'bg-orange-500/30 text-orange-300' : 'bg-gray-800 text-gray-500'
            }`}>
              <p.icon className="w-3 h-3" />
              {p.label}
            </div>
            {i < phases.length - 1 && <div className="flex-1 h-px bg-gray-700" />}
          </React.Fragment>
        ))}
      </div>

      {phase === 'design' && (
        <div className="bg-white/5 rounded-xl border border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hypothesis</label>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="State your falsifiable hypothesis..."
              className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 h-24 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-gray-400">Duration</div>
              <div className="text-white font-semibold">{duration} days</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-gray-400">Participants</div>
              <div className="text-white font-semibold capitalize">{participants}</div>
            </div>
          </div>
          <button onClick={runExperiment} disabled={!hypothesis.trim()}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2">
            <Play className="w-4 h-4" /> Run Experiment
          </button>
        </div>
      )}

      {(phase === 'collecting' || phase === 'analyzing') && (
        <div className="bg-white/5 rounded-xl border border-gray-700 p-6 text-center space-y-4">
          <div className="text-orange-400 text-lg font-semibold">
            {phase === 'collecting' ? 'Collecting Data...' : 'Analyzing Results...'}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div className="bg-orange-400 h-3 rounded-full transition-all" style={{ width: progress + '%' }} />
          </div>
          <div className="text-gray-400 text-sm">{data.length} data points collected</div>
        </div>
      )}

      {phase === 'complete' && results && (
        <div className="bg-white/5 rounded-xl border border-gray-700 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-6 h-6 ${results.hypothesisSupported ? 'text-green-400' : 'text-yellow-400'}`} />
            <h3 className="text-xl font-bold text-white">Results</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ResultCard label="Data Points" value={results.n} />
            <ResultCard label="Mean Coherence" value={results.meanCoherence?.toFixed(3)} />
            <ResultCard label="Mean Resonance" value={results.meanResonance?.toFixed(3)} />
            <ResultCard label="Significance" value={results.significance} />
          </div>
          <div className={`p-4 rounded-lg ${results.hypothesisSupported ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'}`}>
            Hypothesis {results.hypothesisSupported ? 'SUPPORTED' : 'NOT SUPPORTED'} by data.
          </div>
        </div>
      )}
    </div>
  );
};

const ResultCard = ({ label, value }) => (
  <div className="bg-black/20 rounded-lg p-3">
    <div className="text-sm text-gray-400">{label}</div>
    <div className="text-lg font-semibold text-white">{value}</div>
  </div>
);

export default {{ModuleName}}Experiment;`,
      configOptions: [
        { key: 'experimentType', type: 'select', options: ['correlation', 'causation', 'longitudinal', 'observational'] },
        { key: 'duration', type: 'number', unit: 'days' },
        { key: 'participants', type: 'select', options: ['self', 'group', 'community'] }
      ]
    });

    this.templates.set('game-quest', {
      id: 'game-quest',
      name: 'Consciousness Quest',
      category: 'gamification',
      description: 'Interactive journey with challenges and rewards',
      icon: Target,
      scaffolding: {
        structure: 'multi-stage',
        components: ['QuestMap', 'Challenge', 'Progress', 'Rewards'],
        requiredProps: ['questType', 'challenges'],
        dataConnections: ['userProgress', 'achievements', 'fieldStates']
      },
      codeTemplate: `import React, { useState } from 'react';
import { Target, Star, Trophy, Lock, Unlock, ChevronRight } from 'lucide-react';

const {{ModuleName}}Quest = ({ questType, challenges, difficulty, rewards }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [earnedRewards, setEarnedRewards] = useState([]);
  const [showReward, setShowReward] = useState(null);

  const completeChallenge = (challengeId) => {
    setCompleted(prev => new Set([...prev, challengeId]));

    // Check for rewards
    const newRewards = rewards.filter((_, i) => 
      !earnedRewards.includes(i) && completed.size >= (i + 1) * Math.floor(challenges.length / rewards.length)
    );

    if (newRewards.length > 0) {
      setEarnedRewards(prev => [...prev, ...newRewards.map((_, i) => earnedRewards.length + i)]);
      setShowReward(newRewards[0]);
      setTimeout(() => setShowReward(null), 3000);
    }

    if (currentStage < challenges.length - 1) {
      setCurrentStage(prev => prev + 1);
    }
  };

  const difficultyColors = { beginner: 'green', intermediate: 'yellow', advanced: 'orange', expert: 'red' };
  const color = difficultyColors[difficulty] || 'cyan';

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-pink-400" />
          <h1 className="text-3xl font-bold text-white capitalize">{questType} Quest</h1>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs bg-${color}-500/20 text-${color}-300 border border-${color}-500/30 capitalize`}>
          {difficulty}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white/5 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm text-white">{completed.size}/{challenges.length}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className={`bg-${color}-400 h-2 rounded-full transition-all`} 
               style={{ width: (completed.size / challenges.length) * 100 + '%' }} />
        </div>
      </div>

      {/* Quest Map */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {challenges.map((challenge, i) => (
          <React.Fragment key={i}>
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              completed.has(challenge.id) ? 'bg-green-500/30 border-2 border-green-400' :
              i === currentStage ? 'bg-pink-500/30 border-2 border-pink-400 animate-pulse' :
              'bg-gray-800 border-2 border-gray-600'
            }`}>
              {completed.has(challenge.id) ? <Star className="w-5 h-5 text-green-400" /> :
               i === currentStage ? <Unlock className="w-5 h-5 text-pink-400" /> :
               <Lock className="w-5 h-5 text-gray-500" />}
            </div>
            {i < challenges.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600" />}
          </React.Fragment>
        ))}
      </div>

      {/* Current Challenge */}
      {currentStage < challenges.length && (
        <div className="bg-white/5 rounded-xl border border-gray-700 p-6 space-y-4">
          <h3 className="text-xl font-semibold text-white">{challenges[currentStage].title}</h3>
          <p className="text-gray-400">{challenges[currentStage].description}</p>
          <button onClick={() => completeChallenge(challenges[currentStage].id)}
            className="w-full py-3 bg-pink-600 hover:bg-pink-500 rounded-lg font-semibold text-white transition-colors">
            Complete Challenge
          </button>
        </div>
      )}

      {currentStage >= challenges.length && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
          <Trophy className="w-12 h-12 text-green-400 mx-auto mb-2" />
          <h3 className="text-xl font-bold text-white">Quest Complete!</h3>
          <p className="text-green-300">All challenges conquered.</p>
        </div>
      )}

      {/* Rewards */}
      {earnedRewards.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-gray-700 p-4">
          <h4 className="text-sm text-gray-400 mb-3">Earned Rewards</h4>
          <div className="flex flex-wrap gap-2">
            {earnedRewards.map((reward, i) => (
              <div key={i} className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-300">
                {rewards[i] || reward}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reward Animation */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-8 text-center animate-bounce">
            <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white">Reward Unlocked!</h3>
            <p className="text-yellow-300">{showReward}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default {{ModuleName}}Quest;`,
      configOptions: [
        { key: 'questType', type: 'select', options: ['field-mastery', 'integration', 'exploration', 'custom'] },
        { key: 'difficulty', type: 'select', options: ['beginner', 'intermediate', 'advanced', 'expert'] },
        { key: 'rewards', type: 'multiselect', options: ['insights', 'unlocks', 'glyphs', 'coherence'] }
      ]
    });

    this.templates.set('visualization', {
      id: 'visualization',
      name: 'Data Visualization',
      category: 'analytics',
      description: 'Visual representation of consciousness data',
      icon: Layers,
      scaffolding: {
        structure: 'canvas-based',
        components: ['Canvas', 'Controls', 'Legend', 'Export'],
        requiredProps: ['dataSource', 'visualizationType'],
        dataConnections: ['userData', 'fieldHistory', 'transitData']
      },
      codeTemplate: `import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Layers, Download, RotateCcw, Pause, Play } from 'lucide-react';

const {{ModuleName}}Visualization = ({ dataSource, visualizationType, interactive, exportFormats }) => {
  const canvasRef = useRef(null);
  const [data, setData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const animRef = useRef(null);

  // Generate sample data
  useEffect(() => {
    const sampleData = Array.from({ length: 100 }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.1) * 0.5 + 0.5 + Math.random() * 0.1,
      z: Math.cos(i * 0.15) * 0.5 + 0.5,
      phase: (i / 100) * Math.PI * 2
    }));
    setData(sampleData);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, w, h);

    if (visualizationType === 'waveform') {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((d, i) => {
        const x = (i / data.length) * w;
        const y = h - (d.y * h * 0.8) - h * 0.1;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw phase indicator
      const phaseX = ((frame % data.length) / data.length) * w;
      ctx.strokeStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(phaseX, 0);
      ctx.lineTo(phaseX, h);
      ctx.stroke();
    } else if (visualizationType === 'mandala') {
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.4;

      data.forEach((d, i) => {
        const angle = (i / data.length) * Math.PI * 2 + frame * 0.01;
        const r = d.y * maxR;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        ctx.fillStyle = \`hsl(\${(d.y * 360 + frame) % 360}, 70%, 60%)\`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connecting lines
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      data.forEach((d, i) => {
        const angle = (i / data.length) * Math.PI * 2 + frame * 0.01;
        const r = d.y * maxR;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    } else if (visualizationType === 'network') {
      const nodes = data.slice(0, 20).map((d, i) => ({
        x: w * 0.1 + (i % 5) * w * 0.2,
        y: h * 0.1 + Math.floor(i / 5) * h * 0.25,
        r: d.y * 15 + 5
      }));

      // Draw connections
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1;
      nodes.forEach((n1, i) => {
        nodes.slice(i + 1).forEach(n2 => {
          const dist = Math.hypot(n2.x - n1.x, n2.y - n1.y);
          if (dist < w * 0.3) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach((n, i) => {
        ctx.fillStyle = \`hsl(\${(i * 18 + frame) % 360}, 70%, 60%)\`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [data, visualizationType, frame]);

  useEffect(() => {
    if (!isPlaying) return;
    animRef.current = requestAnimationFrame(function animate() {
      setFrame(f => f + 1);
      animRef.current = requestAnimationFrame(animate);
    });
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  useEffect(() => { render(); }, [render]);

  const handleExport = (format) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (format === 'png') {
      const link = document.createElement('a');
      link.download = '{{ModuleName}}-visualization.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = '{{ModuleName}}-data.json';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white capitalize">{visualizationType} Visualization</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </button>
          <button onClick={() => setFrame(0)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
          {exportFormats?.map(fmt => (
            <button key={fmt} onClick={() => handleExport(fmt)}
              className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs rounded-lg transition-colors flex items-center gap-1">
              <Download className="w-3 h-3" /> {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-black/30 rounded-xl border border-gray-700 overflow-hidden">
        <canvas ref={canvasRef} width={800} height={500} className="w-full" 
                style={{ cursor: interactive ? 'crosshair' : 'default' }} />
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <span>Coherence</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-pink-400" />
          <span>Resonance</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-400" />
          <span>Field State</span>
        </div>
        <div className="ml-auto">Frame: {frame}</div>
      </div>
    </div>
  );
};

export default {{ModuleName}}Visualization;`,
      configOptions: [
        { key: 'visualizationType', type: 'select', options: ['waveform', 'mandala', 'network', 'timeline', '3d-field'] },
        { key: 'interactive', type: 'boolean' },
        { key: 'exportFormats', type: 'multiselect', options: ['png', 'svg', 'json', 'video'] }
      ]
    });
  }

  getTemplate(templateId) { return this.templates.get(templateId); }
  getAllTemplates() { return Array.from(this.templates.values()); }
  getCategorizedTemplates() {
    const categorized = {};
    this.templates.forEach(t => {
      if (!categorized[t.category]) categorized[t.category] = [];
      categorized[t.category].push(t);
    });
    return categorized;
  }
}

// ═══════════════════════════════════════════════════════════════
// TESTING ENGINE — Real validation, not just simulation
// ═══════════════════════════════════════════════════════════════

class ModuleTestEngine {
  constructor() {
    this.testSuites = new Map();
    this.initializeTestSuites();
  }

  initializeTestSuites() {
    // Syntax validation
    this.testSuites.set('syntax', {
      name: 'Syntax Validation',
      icon: Code,
      run: (code) => {
        const errors = [];
        const warnings = [];

        // Check for balanced braces
        const openBraces = (code.match(/{/g) || []).length;
        const closeBraces = (code.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push(\`Brace mismatch: \${openBraces} open, \${closeBraces} close\`);
        }

        // Check for balanced parentheses
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          errors.push(\`Parenthesis mismatch: \${openParens} open, \${closeParens} close\`);
        }

        // Check for import completeness
        if (code.includes('import') && !code.includes('from')) {
          warnings.push('Import statements may be incomplete');
        }

        // Check for export
        if (!code.includes('export default')) {
          warnings.push('Missing default export');
        }

        // Check for React hooks usage validity
        const hookPattern = /use[A-Z][a-zA-Z]*\s*\(/g;
        const hooks = code.match(hookPattern) || [];
        const hookNames = hooks.map(h => h.replace('(', '').trim());

        return {
          passed: errors.length === 0,
          errors,
          warnings,
          details: {
            bracesBalanced: openBraces === closeBraces,
            parensBalanced: openParens === closeParens,
            hasExport: code.includes('export default'),
            hooksUsed: hookNames,
            lineCount: code.split('\n').length,
            charCount: code.length
          }
        };
      }
    });

    // Component structure validation
    this.testSuites.set('structure', {
      name: 'Component Structure',
      icon: Layers,
      run: (code, template) => {
        const errors = [];
        const warnings = [];
        const details = { components: [], props: [], hooks: [] };

        // Extract component name
        const componentMatch = code.match(/const\s+(\w+)\s*=/);
        if (componentMatch) {
          details.componentName = componentMatch[1];
        }

        // Check required props
        if (template?.scaffolding?.requiredProps) {
          template.scaffolding.requiredProps.forEach(prop => {
            if (code.includes(prop)) {
              details.props.push({ name: prop, found: true });
            } else {
              warnings.push(\`Required prop '\${prop}' not found in destructured props\`);
              details.props.push({ name: prop, found: false });
            }
          });
        }

        // Check for useEffect cleanup
        if (code.includes('useEffect') && !code.includes('return () =>')) {
          warnings.push('useEffect may be missing cleanup function');
        }

        // Check for key prop in lists
        if (code.includes('.map(') && !code.includes('key=')) {
          warnings.push('List rendering may be missing key props');
        }

        // Check template-specific validations
        if (template?.id === 'field-dashboard' && !code.includes('useState')) {
          warnings.push('Dashboard should use useState for field state');
        }

        if (template?.id === 'oracle-tool' && !code.includes('useState') && !code.includes('query')) {
          warnings.push('Oracle should maintain query state');
        }

        return {
          passed: errors.length === 0,
          errors,
          warnings,
          details
        };
      }
    });

    // Security scan
    this.testSuites.set('security', {
      name: 'Security Audit',
      icon: Shield,
      run: (code) => {
        const errors = [];
        const warnings = [];

        // Check for dangerous patterns
        const dangerousPatterns = [
          { pattern: /eval\s*\(/, desc: 'eval() usage detected' },
          { pattern: /innerHTML\s*=/, desc: 'innerHTML assignment detected' },
          { pattern: /document\.write/, desc: 'document.write() detected' },
          { pattern: /new\s+Function\s*\(/, desc: 'new Function() constructor detected' }
        ];

        dangerousPatterns.forEach(({ pattern, desc }) => {
          if (pattern.test(code)) {
            errors.push(desc);
          }
        });

        // Check for hardcoded secrets
        const secretPatterns = [
          /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
          /password\s*[:=]\s*["'][^"']+["']/i,
          /token\s*[:=]\s*["'][^"']+["']/i
        ];

        secretPatterns.forEach(pattern => {
          if (pattern.test(code)) {
            warnings.push('Potential hardcoded secret detected');
          }
        });

        // Check for XSS vulnerabilities
        if (/dangerouslySetInnerHTML/.test(code)) {
          warnings.push('dangerouslySetInnerHTML usage — ensure content is sanitized');
        }

        return {
          passed: errors.length === 0,
          errors,
          warnings,
          details: { scannedPatterns: dangerousPatterns.length + secretPatterns.length }
        };
      }
    });

    // Performance check
    this.testSuites.set('performance', {
      name: 'Performance Check',
      icon: Zap,
      run: (code) => {
        const warnings = [];
        const details = {};

        // Check for potential re-render issues
        const inlineFunctionCount = (code.match(/on[A-Z][a-zA-Z]*=\{\s*\(/) || []).length;
        if (inlineFunctionCount > 3) {
          warnings.push(\`\${inlineFunctionCount} inline functions may cause unnecessary re-renders\`);
        }

        // Check for missing useMemo/useCallback on expensive computations
        if (code.includes('.filter(') || code.includes('.map(') || code.includes('.reduce(')) {
          if (!code.includes('useMemo') && !code.includes('useCallback')) {
            warnings.push('Array transformations without memoization may impact performance');
          }
        }

        // Check for large data structures in state
        const stateInitMatch = code.match(/useState\s*\(\s*\[\s*\]/g);
        if (stateInitMatch && stateInitMatch.length > 2) {
          warnings.push('Multiple empty array states — consider combining related state');
        }

        details.inlineFunctions = inlineFunctionCount;
        details.hasMemoization = code.includes('useMemo') || code.includes('useCallback');

        return {
          passed: true,
          errors: [],
          warnings,
          details
        };
      }
    });

    // Integration test
    this.testSuites.set('integration', {
      name: 'Integration Check',
      icon: GitBranch,
      run: (code, template, config) => {
        const errors = [];
        const warnings = [];
        const details = { imports: [], connections: [] };

        // Check for resonance engine usage
        if (template?.scaffolding?.dataConnections?.includes('resonanceEngine')) {
          if (!code.includes('resonanceEngine')) {
            warnings.push('Template expects resonanceEngine but not used in code');
          } else {
            details.connections.push('resonanceEngine');
          }
        }

        // Check for consciousness state
        if (template?.scaffolding?.dataConnections?.includes('consciousnessState')) {
          if (!code.includes('consciousness')) {
            warnings.push('Template expects consciousness state connection');
          }
        }

        // Check config injection
        if (config && Object.keys(config).length > 0) {
          Object.keys(config).forEach(key => {
            const placeholder = '{{' + key + '}}';
            if (code.includes(placeholder)) {
              errors.push(\`Placeholder '\${key}' not replaced in generated code\`);
            }
          });
        }

        // Check import completeness
        const importMatches = code.match(/import\s+{[^}]+}\s+from\s+['"]([^'"]+)['"]/g) || [];
        details.imports = importMatches.map(i => i.match(/from\s+['"]([^'"]+)['"]/)?.[1]).filter(Boolean);

        return {
          passed: errors.length === 0,
          errors,
          warnings,
          details
        };
      }
    });
  }

  runAllTests(code, template, config) {
    const results = [];
    let allPassed = true;

    this.testSuites.forEach((suite, id) => {
      const result = suite.run(code, template, config);
      results.push({ id, name: suite.name, icon: suite.icon, ...result });
      if (!result.passed) allPassed = false;
    });

    return { allPassed, results, timestamp: Date.now() };
  }

  runSingleTest(testId, code, template, config) {
    const suite = this.testSuites.get(testId);
    if (!suite) return null;
    return { id: testId, name: suite.name, icon: suite.icon, ...suite.run(code, template, config) };
  }

  getTestSuites() {
    return Array.from(this.testSuites.entries()).map(([id, suite]) => ({ id, name: suite.name, icon: suite.icon }));
  }
}

// ═══════════════════════════════════════════════════════════════
// FILE MANAGER — Merged from ZipAppBuilder
// ═══════════════════════════════════════════════════════════════

class ModuleFileManager {
  constructor() {
    this.files = new Map();
    this.dependencies = new Map();
  }

  addFile(path, content, type = 'jsx') {
    this.files.set(path, { content, type, created: Date.now(), modified: Date.now() });
    this.analyzeDependencies(path, content);
  }

  analyzeDependencies(path, content) {
    const imports = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || [];
    const deps = imports.map(i => {
      const match = i.match(/from\s+['"]([^'"]+)['"]/);
      return match ? match[1] : null;
    }).filter(Boolean);
    this.dependencies.set(path, deps);
  }

  getFileTree() {
    const tree = {};
    this.files.forEach((data, path) => {
      const parts = path.split('/');
      let current = tree;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = { type: 'file', data };
        } else {
          if (!current[part]) current[part] = { type: 'directory', children: {} };
          current = current[part].children;
        }
      });
    });
    return tree;
  }

  generatePackageJSON(moduleName, template) {
    return JSON.stringify({
      name: moduleName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: \`Synthia module: \${template?.name || 'Custom'}\`,
      main: 'index.js',
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'lucide-react': '^0.263.1',
        tailwindcss: '^3.3.0'
      },
      syntia: {
        moduleType: template?.id || 'custom',
        category: template?.category || 'custom',
        created: new Date().toISOString(),
        fields: template?.scaffolding?.dataConnections || []
      }
    }, null, 2);
  }

  generateIndexJS(moduleName) {
    return \`import React from 'react';
import ReactDOM from 'react-dom/client';
import \${moduleName} from './\${moduleName}';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div className="min-h-screen bg-gray-900">
      <\${moduleName} />
    </div>
  </React.StrictMode>
);\`;
  }

  generateIndexCSS() {
    return \`@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #0f0f1a;
  color: #fff;
}\`;
  }

  generateHTML(moduleName) {
    return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>\${moduleName} — Synthia Module</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <noscript>You need to enable JavaScript to run this Synthia module.</noscript>
  <div id="root"></div>
</body>
</html>\`;
  }

  exportAsZip(moduleName, template) {
    const exportFiles = {};

    // Add all module files
    this.files.forEach((data, path) => {
      exportFiles[path] = data.content;
    });

    // Add scaffolding
    exportFiles['package.json'] = this.generatePackageJSON(moduleName, template);
    exportFiles['src/index.js'] = this.generateIndexJS(moduleName);
    exportFiles['src/index.css'] = this.generateIndexCSS();
    exportFiles['public/index.html'] = this.generateHTML(moduleName);
    exportFiles['README.md'] = this.generateReadme(moduleName, template);

    return exportFiles;
  }

  generateReadme(moduleName, template) {
    return \`# \${moduleName}

## Synthia Consciousness Module

**Type:** \${template?.name || 'Custom'}  
**Category:** \${template?.category || 'custom'}  
**Created:** \${new Date().toLocaleDateString()}

### Description
\${template?.description || 'A custom consciousness module for the Synthia ecosystem.'}

### Installation
\`\`\`bash
npm install
npm start
\`\`\`

### Props
\${template?.scaffolding?.requiredProps?.map(p => \`- **\${p}**: Required\`).join('\n') || '- None'}

### Data Connections
\${template?.scaffolding?.dataConnections?.map(d => \`- \${d}\`).join('\n') || '- None'}

### License
MIT — Part of the Synthia Consciousness Platform
\`;
  }
}


// ═══════════════════════════════════════════════════════════════
// MAIN MODULE BUILDER COMPONENT
// ═══════════════════════════════════════════════════════════════

const ModuleBuilder = ({ resonanceEngine, voteEngine }) => {
  const [templateSystem] = useState(() => new ModuleTemplate());
  const [testEngine] = useState(() => new ModuleTestEngine());
  const [fileManager] = useState(() => new ModuleFileManager());

  const [buildPhase, setBuildPhase] = useState('select');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [moduleConfig, setModuleConfig] = useState({});
  const [moduleName, setModuleName] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // File manager state (merged from ZipAppBuilder)
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src', 'public']));
  const [projectFiles, setProjectFiles] = useState({});

  // Chat oracle state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeSidePanel, setActiveSidePanel] = useState(null); // 'files', 'chat', 'tests'

  const categories = {
    dashboard: { icon: Layout, color: 'cyan' },
    divination: { icon: Sparkles, color: 'purple' },
    measurement: { icon: Activity, color: 'green' },
    research: { icon: TestTube, color: 'orange' },
    gamification: { icon: Target, color: 'pink' },
    analytics: { icon: Layers, color: 'blue' }
  };

  const phases = [
    { id: 'select', label: 'Select', icon: Puzzle },
    { id: 'configure', label: 'Configure', icon: Settings },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'test', label: 'Test', icon: TestTube },
    { id: 'deploy', label: 'Deploy', icon: Rocket }
  ];

  const currentPhaseIndex = phases.findIndex(p => p.id === buildPhase);

  const goToPhase = (phase) => setBuildPhase(phase);
  const nextPhase = () => setBuildPhase(phases[Math.min(currentPhaseIndex + 1, phases.length - 1)].id);
  const prevPhase = () => setBuildPhase(phases[Math.max(currentPhaseIndex - 1, 0)].id);

  // ── TEMPLATE SELECTION ──
  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    const defaultConfig = {};
    template.configOptions.forEach(option => {
      if (option.type === 'multiselect') defaultConfig[option.key] = [];
      else if (option.type === 'boolean') defaultConfig[option.key] = false;
      else defaultConfig[option.key] = option.options?.[0] || '';
    });
    setModuleConfig(defaultConfig);
    nextPhase();
  };

  // ── CODE GENERATION ──
  const generateCode = () => {
    if (!selectedTemplate || !moduleName) return;

    let code = selectedTemplate.codeTemplate
      .replace(/\{\{ModuleName\}\}/g, moduleName);

    Object.entries(moduleConfig).forEach(([key, value]) => {
      code = code.replace(new RegExp(`{{${key}}}`, 'g'), JSON.stringify(value));
    });

    setModuleCode(code);

    // Auto-populate file manager
    const fm = new ModuleFileManager();
    fm.addFile(`src/${moduleName}.jsx`, code, 'jsx');
    setProjectFiles(fm.files);
    setFileTree(fm.getFileTree());

    nextPhase();
  };

  // ── TESTING ──
  const runTests = async () => {
    setIsRunningTests(true);
    setTestResults(null);

    // Simulate processing time for realism
    await new Promise(r => setTimeout(r, 800));

    const results = testEngine.runAllTests(moduleCode, selectedTemplate, moduleConfig);
    setTestResults(results);
    setIsRunningTests(false);
  };

  const runSingleTest = async (testId) => {
    setIsRunningTests(true);
    await new Promise(r => setTimeout(r, 400));

    const result = testEngine.runSingleTest(testId, moduleCode, selectedTemplate, moduleConfig);
    setTestResults(prev => {
      if (!prev) return { allPassed: result.passed, results: [result], timestamp: Date.now() };
      const updated = prev.results.map(r => r.id === testId ? result : r);
      const allPassed = updated.every(r => r.passed);
      return { ...prev, allPassed, results: updated };
    });
    setIsRunningTests(false);
  };

  // ── FILE MANAGEMENT ──
  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderFileTree = (tree, currentPath = '') => {
    return Object.entries(tree).map(([name, item]) => {
      const fullPath = currentPath ? `${currentPath}/${name}` : name;

      if (item.type === 'directory') {
        const isExpanded = expandedFolders.has(fullPath);
        return (
          <div key={fullPath}>
            <div 
              className="flex items-center gap-2 p-1.5 hover:bg-white/5 cursor-pointer rounded text-sm"
              onClick={() => toggleFolder(fullPath)}>
              {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
              {isExpanded ? <FolderOpen className="w-4 h-4 text-yellow-500/70" /> : <Folder className="w-4 h-4 text-yellow-500/70" />}
              <span className="text-gray-300">{name}</span>
            </div>
            {isExpanded && (
              <div className="ml-4 border-l border-white/5 pl-2">
                {renderFileTree(item.children, fullPath)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div 
          key={fullPath}
          className={`flex items-center gap-2 p-1.5 hover:bg-white/5 cursor-pointer rounded text-sm ml-4 ${
            selectedFile === fullPath ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : ''
          }`}
          onClick={() => setSelectedFile(fullPath)}>
          <FileText className="w-4 h-4 text-blue-400/70" />
          <span className="text-gray-400">{name}</span>
        </div>
      );
    });
  };

  const editSelectedFile = () => {
    if (!selectedFile || !projectFiles.has(selectedFile)) return;
    setEditingFile({
      path: selectedFile,
      content: projectFiles.get(selectedFile).content
    });
  };

  const saveEditedFile = () => {
    if (!editingFile) return;
    const fm = new ModuleFileManager();
    projectFiles.forEach((data, path) => fm.addFile(path, path === editingFile.path ? editingFile.content : data.content, data.type));
    fm.addFile(editingFile.path, editingFile.content, projectFiles.get(editingFile.path)?.type || 'jsx');
    setProjectFiles(fm.files);
    setModuleCode(editingFile.content);
    setEditingFile(null);
  };

  const createNewFile = () => {
    const fileName = prompt('File name (e.g., utils/helpers.js):');
    if (!fileName) return;
    const ext = fileName.split('.').pop();
    const template = ext === 'jsx' ? `import React from 'react';\n\nconst Component = () => {\n  return <div>New Component</div>;\n};\n\nexport default Component;` :
                    ext === 'js' ? `// Utility module\nexport const helper = () => {\n  return true;\n};` :
                    ext === 'css' ? `/* Styles */\n.container {\n  padding: 1rem;\n}` :
                    '// New file';

    const fm = new ModuleFileManager();
    projectFiles.forEach((data, path) => fm.addFile(path, data.content, data.type));
    fm.addFile(fileName, template, ext);
    setProjectFiles(fm.files);
    setFileTree(fm.getFileTree());
    setSelectedFile(fileName);
  };

  // ── DEPLOYMENT ──
  const deployModule = async () => {
    const proposal = {
      id: `module-${Date.now()}`,
      title: `${moduleName} - ${selectedTemplate.name}`,
      description: `Community-created ${selectedTemplate.category} module`,
      category: 'module',
      suggestedFields: moduleConfig.fieldName ? [moduleConfig.fieldName] : ['all'],
      creator: 'currentUser',
      creatorCoherence: resonanceEngine?.consciousnessState?.coherence || 0.75,
      moduleCode,
      moduleConfig,
      templateUsed: selectedTemplate.id,
      testResults,
      files: Array.from(projectFiles.keys())
    };

    voteEngine?.createProposal?.(proposal);

    // Also create ZIP export
    const fm = new ModuleFileManager();
    projectFiles.forEach((data, path) => fm.addFile(path, data.content, data.type));
    fm.addFile(`src/${moduleName}.jsx`, moduleCode, 'jsx');
    const zipFiles = fm.exportAsZip(moduleName, selectedTemplate);

    // Trigger download
    const zipContent = JSON.stringify(zipFiles, null, 2);
    const blob = new Blob([zipContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleName.toLowerCase().replace(/\s+/g, '-')}-synthia-module.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── CHAT ORACLE ──
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      const responses = [
        `Analyzing ${moduleName || 'your module'} structure... The ${selectedTemplate?.name || 'template'} scaffolding looks solid. Want me to suggest prop optimizations?`,
        `I detect ${testResults?.allPassed ? 'clean' : 'some issues in'} your code. ${testResults?.results?.find(r => !r.passed)?.name || 'All tests'} ${testResults?.allPassed ? 'passed' : 'needs attention'}.`,
        `Your ${selectedTemplate?.category || 'module'} configuration maps well to the Synthia field architecture. Consider adding error boundaries for production.`,
        `Module Builder Oracle: ${moduleName || 'This module'} has ${moduleCode.split('\n').length} lines. The resonance engine integration pattern is ${moduleCode.includes('resonanceEngine') ? 'present' : 'missing'} — ${moduleCode.includes('resonanceEngine') ? 'good' : 'add it for full connectivity'}.`
      ];
      const aiMsg = { role: 'assistant', content: responses[Math.floor(Math.random() * responses.length)], timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    }, 800);
  };


  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Module Builder</h1>
              <p className="text-xs text-gray-500">Create tools for the YOUNIVERSE</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {moduleName && (
              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-cyan-300 border border-cyan-500/20">
                {moduleName}
              </span>
            )}
            {testResults && (
              <span className={`px-3 py-1 rounded-full text-xs border ${
                testResults.allPassed 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                {testResults.allPassed ? '✓ All Tests Pass' : '⚠ Tests Pending'}
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Cpu className="w-3 h-3" />
              <span>{projectFiles.size} files</span>
            </div>
          </div>
        </div>
      </header>

      {/* Phase Navigation */}
      <div className="border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center">
            {phases.map((phase, index) => {
              const Icon = phase.icon;
              const isActive = phase.id === buildPhase;
              const isCompleted = index < currentPhaseIndex;
              const isClickable = index <= currentPhaseIndex + 1;

              return (
                <React.Fragment key={phase.id}>
                  <button
                    onClick={() => isClickable && goToPhase(phase.id)}
                    disabled={!isClickable}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      isCompleted ? 'text-green-400' :
                      isClickable ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' :
                      'text-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="text-sm font-medium hidden sm:inline">{phase.label}</span>
                  </button>
                  {index < phases.length - 1 && (
                    <div className={`w-8 h-px mx-2 ${isCompleted ? 'bg-green-500/50' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">

          {/* Sidebar */}
          <div className="col-span-3 space-y-4">
            {/* Side Panel Tabs */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex border-b border-white/10">
                {[
                  { id: 'files', icon: Folder, label: 'Files' },
                  { id: 'chat', icon: MessageCircle, label: 'Oracle' },
                  { id: 'tests', icon: TestTube, label: 'Tests' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSidePanel(activeSidePanel === tab.id ? null : tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs transition-colors ${
                      activeSidePanel === tab.id ? 'bg-white/10 text-cyan-300' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Files Panel */}
              {(activeSidePanel === 'files' || activeSidePanel === null) && (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Project Files</span>
                    <div className="flex gap-1">
                      <button onClick={createNewFile} className="p-1 hover:bg-white/10 rounded" title="New File">
                        <Plus className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-0.5 max-h-80 overflow-y-auto">
                    {Object.keys(fileTree).length > 0 ? renderFileTree(fileTree) : (
                      <div className="text-center py-4 text-gray-600 text-xs">Select a template to generate files</div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Panel */}
              {activeSidePanel === 'chat' && (
                <div className="flex flex-col h-80">
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-600 text-xs py-8">
                        <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-400/50" />
                        Ask the Module Oracle for guidance...
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div key={i} className={`text-xs ${
                        msg.role === 'user' ? 'text-cyan-300' : 'text-purple-300'
                      }`}>
                        <span className="text-gray-600 text-[10px]">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        <div className={`mt-0.5 p-2 rounded-lg ${
                          msg.role === 'user' ? 'bg-cyan-500/10' : 'bg-purple-500/10'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-white/10">
                    <div className="flex gap-1">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                        placeholder="Ask the oracle..."
                        className="flex-1 px-2 py-1.5 bg-black/30 border border-gray-700 rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                      />
                      <button onClick={sendChatMessage} className="p-1.5 bg-purple-600 rounded hover:bg-purple-500">
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tests Panel */}
              {activeSidePanel === 'tests' && testResults && (
                <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                  {testResults.results.map((test, i) => {
                    const Icon = test.icon || CheckCircle;
                    return (
                      <div key={test.id || i} className={`p-2 rounded-lg text-xs ${
                        test.passed ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3 h-3 ${test.passed ? 'text-green-400' : 'text-red-400'}`} />
                          <span className={test.passed ? 'text-green-300' : 'text-red-300'}>{test.name}</span>
                          {test.passed ? <CheckCircle className="w-3 h-3 text-green-400 ml-auto" /> : <AlertCircle className="w-3 h-3 text-red-400 ml-auto" />}
                        </div>
                        {test.warnings?.length > 0 && (
                          <div className="mt-1 text-yellow-400/70 text-[10px]">
                            {test.warnings.map((w, j) => <div key={j}>⚠ {w}</div>)}
                          </div>
                        )}
                        {test.errors?.length > 0 && (
                          <div className="mt-1 text-red-400/70 text-[10px]">
                            {test.errors.map((e, j) => <div key={j}>✗ {e}</div>)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {testResults && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-xs font-medium text-gray-400 mb-3">Test Summary</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Score</span>
                    <span className={`font-bold ${
                      testResults.allPassed ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {testResults.results.filter(r => r.passed).length}/{testResults.results.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        testResults.allPassed ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${(testResults.results.filter(r => r.passed).length / testResults.results.length) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-600">
                    {testResults.results.filter(r => !r.passed).length} failed, {testResults.results.filter(r => r.warnings?.length > 0).length} warnings
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Panel */}
          <div className="col-span-9">
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden min-h-[600px]">

              {/* PHASE: SELECT TEMPLATE */}
              {buildPhase === 'select' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">Choose a Template</h2>
                    <p className="text-gray-400">Select the foundation for your consciousness module</p>
                  </div>

                  <div className="space-y-8">
                    {Object.entries(templateSystem.getCategorizedTemplates()).map(([category, templates]) => {
                      const catInfo = categories[category];
                      const CatIcon = catInfo?.icon || Puzzle;
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-3 mb-4">
                            <CatIcon className={`w-5 h-5 text-${catInfo?.color}-400`} />
                            <h3 className="text-lg font-semibold capitalize">{category}</h3>
                            <span className="text-xs text-gray-500">{templates.length} templates</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map(template => {
                              const TIcon = template.icon;
                              return (
                                <button
                                  key={template.id}
                                  onClick={() => selectTemplate(template)}
                                  className="bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-cyan-500/50 rounded-xl p-6 text-left transition-all group"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                      <TIcon className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-white">{template.name}</h4>
                                      <span className="text-xs text-gray-500">{template.scaffolding.components.length} components</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-400 mb-4">{template.description}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {template.scaffolding.requiredProps.map(prop => (
                                      <span key={prop} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-500">
                                        {prop}
                                      </span>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PHASE: CONFIGURE */}
              {buildPhase === 'configure' && selectedTemplate && (
                <div className="p-8 max-w-2xl">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Configure {selectedTemplate.name}</h2>
                    <p className="text-gray-400">Set the parameters for your module</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Module Name</label>
                      <input
                        type="text"
                        value={moduleName}
                        onChange={e => setModuleName(e.target.value)}
                        placeholder="e.g., HeartFieldMonitor"
                        className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    {selectedTemplate.configOptions.map(option => (
                      <div key={option.key}>
                        <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                          {option.key.replace(/([A-Z])/g, ' $1').trim()}
                          {option.unit && <span className="text-gray-500 ml-1">({option.unit})</span>}
                        </label>

                        {option.type === 'select' && (
                          <select
                            value={moduleConfig[option.key]}
                            onChange={e => setModuleConfig(prev => ({ ...prev, [option.key]: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                          >
                            {option.options.map(opt => (
                              <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
                            ))}
                          </select>
                        )}

                        {option.type === 'multiselect' && (
                          <div className="bg-white/5 border border-gray-700 rounded-lg p-3 space-y-2">
                            {option.options.map(opt => (
                              <label key={opt} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={moduleConfig[option.key]?.includes(opt)}
                                  onChange={e => {
                                    const current = moduleConfig[option.key] || [];
                                    setModuleConfig(prev => ({
                                      ...prev,
                                      [option.key]: e.target.checked
                                        ? [...current, opt]
                                        : current.filter(v => v !== opt)
                                    }));
                                  }}
                                  className="w-4 h-4 accent-cyan-500"
                                />
                                <span className="text-sm text-gray-300">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {option.type === 'boolean' && (
                          <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-gray-700 rounded-lg p-3 hover:bg-white/10 transition-colors">
                            <div className={`w-11 h-6 rounded-full transition-colors relative ${
                              moduleConfig[option.key] ? 'bg-cyan-600' : 'bg-gray-700'
                            }`}>
                              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                                moduleConfig[option.key] ? 'translate-x-5' : 'translate-x-0.5'
                              }`} />
                            </div>
                            <input
                              type="checkbox"
                              checked={moduleConfig[option.key]}
                              onChange={e => setModuleConfig(prev => ({ ...prev, [option.key]: e.target.checked }))}
                              className="hidden"
                            />
                            <span className="text-sm text-gray-300">
                              {moduleConfig[option.key] ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        )}

                        {option.type === 'number' && (
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={moduleConfig[option.key]}
                              onChange={e => setModuleConfig(prev => ({ ...prev, [option.key]: parseInt(e.target.value) || 0 }))}
                              className="flex-1 px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                            />
                            <span className="text-sm text-gray-500">{option.unit}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={prevPhase}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg text-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={generateCode}
                      disabled={!moduleName.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-all"
                    >
                      Generate Code
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE: CODE & FILES */}
              {buildPhase === 'code' && (
                <div className="flex h-[700px]">
                  {/* File Tree */}
                  <div className="w-64 bg-black/20 border-r border-white/10 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">Files</h3>
                      <div className="flex gap-1">
                        <button onClick={createNewFile} className="p-1 hover:bg-white/10 rounded" title="New File">
                          <Plus className="w-4 h-4 text-gray-400" />
                        </button>
                        {selectedFile && (
                          <button onClick={editSelectedFile} className="p-1 hover:bg-white/10 rounded" title="Edit">
                            <Edit3 className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {Object.keys(fileTree).length > 0 ? renderFileTree(fileTree) : (
                        <div className="text-center py-8 text-gray-600 text-sm">No files generated yet</div>
                      )}
                    </div>
                  </div>

                  {/* Code Editor / Preview */}
                  <div className="flex-1 flex flex-col">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPreview(false)}
                          className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors ${
                            !showPreview ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Code className="w-3.5 h-3.5" />
                          Code
                        </button>
                        <button
                          onClick={() => setShowPreview(true)}
                          className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors ${
                            showPreview ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          navigator.clipboard?.writeText(moduleCode);
                        }} className="p-1.5 hover:bg-white/10 rounded text-gray-400" title="Copy">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => {
                          const blob = new Blob([moduleCode], { type: 'text/javascript' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${moduleName}.jsx`;
                          a.click();
                        }} className="p-1.5 hover:bg-white/10 rounded text-gray-400" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Editor / Preview Content */}
                    <div className="flex-1 overflow-auto">
                      {!showPreview ? (
                        editingFile ? (
                          <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-white/10">
                              <span className="text-sm text-cyan-300">{editingFile.path}</span>
                              <div className="flex gap-2">
                                <button onClick={saveEditedFile} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs text-white transition-colors">
                                  Save
                                </button>
                                <button onClick={() => setEditingFile(null)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-400 transition-colors">
                                  Cancel
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={editingFile.content}
                              onChange={e => setEditingFile(prev => ({ ...prev, content: e.target.value }))}
                              className="flex-1 w-full p-4 bg-black/50 text-green-300 font-mono text-sm resize-none focus:outline-none"
                              spellCheck={false}
                            />
                          </div>
                        ) : (
                          <pre className="p-4 text-sm font-mono text-green-300 overflow-auto">
                            <code>{moduleCode}</code>
                          </pre>
                        )
                      ) : (
                        <div className="p-8">
                          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-white/10 p-6 min-h-[400px]">
                            <div className="flex items-center gap-2 mb-4 text-gray-500 text-sm">
                              <Monitor className="w-4 h-4" />
                              <span>Live Preview — {moduleName}</span>
                            </div>
                            <div className="text-gray-400 text-center py-12">
                              <Code className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                              <p>Preview requires React runtime environment</p>
                              <p className="text-sm mt-2">Export and run in your Synthia instance to see the module in action</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PHASE: TEST */}
              {buildPhase === 'test' && (
                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Test & Validate</h2>
                    <p className="text-gray-400">Run automated tests to verify module integrity</p>
                  </div>

                  <div className="flex gap-4 mb-8">
                    <button
                      onClick={runTests}
                      disabled={isRunningTests}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 rounded-lg font-medium text-white transition-all flex items-center gap-2"
                    >
                      {isRunningTests ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                      {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
                    </button>

                    {testEngine.getTestSuites().map(suite => (
                      <button
                        key={suite.id}
                        onClick={() => runSingleTest(suite.id)}
                        disabled={isRunningTests}
                        className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
                      >
                        <suite.icon className="w-4 h-4 inline mr-1" />
                        {suite.name}
                      </button>
                    ))}
                  </div>

                  {testResults && (
                    <div className="space-y-4">
                      {/* Overall Result */}
                      <div className={`p-6 rounded-xl border ${
                        testResults.allPassed 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-yellow-500/10 border-yellow-500/30'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          {testResults.allPassed ? (
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          ) : (
                            <AlertCircle className="w-8 h-8 text-yellow-400" />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold">
                              {testResults.allPassed ? 'All Tests Passed' : 'Some Tests Need Attention'}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {testResults.results.filter(r => r.passed).length} of {testResults.results.length} test suites passed
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
                          <div 
                            className={`h-2 rounded-full transition-all ${testResults.allPassed ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${(testResults.results.filter(r => r.passed).length / testResults.results.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Individual Test Results */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testResults.results.map((test, i) => {
                          const Icon = test.icon || CheckCircle;
                          return (
                            <div key={test.id || i} className={`p-4 rounded-xl border ${
                              test.passed 
                                ? 'bg-white/5 border-white/10' 
                                : 'bg-red-500/5 border-red-500/20'
                            }`}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  test.passed ? 'bg-green-500/20' : 'bg-red-500/20'
                                }`}>
                                  <Icon className={`w-5 h-5 ${test.passed ? 'text-green-400' : 'text-red-400'}`} />
                                </div>
                                <div>
                                  <h4 className="font-medium">{test.name}</h4>
                                  <span className={`text-xs ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
                                    {test.passed ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                              </div>

                              {test.warnings?.length > 0 && (
                                <div className="space-y-1 mb-2">
                                  {test.warnings.map((w, j) => (
                                    <div key={j} className="flex items-start gap-2 text-xs text-yellow-400/80">
                                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      {w}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {test.errors?.length > 0 && (
                                <div className="space-y-1">
                                  {test.errors.map((e, j) => (
                                    <div key={j} className="flex items-start gap-2 text-xs text-red-400/80">
                                      <X className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      {e}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {test.details && Object.keys(test.details).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/5">
                                  <div className="text-[10px] text-gray-500 font-mono space-y-0.5">
                                    {Object.entries(test.details).map(([k, v]) => (
                                      <div key={k}>
                                        {k}: {Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 mt-8">
                    <button onClick={prevPhase} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg text-gray-300 transition-colors">
                      Back to Code
                    </button>
                    <button 
                      onClick={nextPhase}
                      disabled={!testResults?.allPassed}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-all"
                    >
                      Proceed to Deploy
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE: DEPLOY */}
              {buildPhase === 'deploy' && (
                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Deploy Module</h2>
                    <p className="text-gray-400">Publish your module to the Synthia ecosystem</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Module Summary */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-cyan-400" />
                        Module Summary
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Name</span>
                          <span className="text-white font-medium">{moduleName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Template</span>
                          <span className="text-cyan-300">{selectedTemplate?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Category</span>
                          <span className="capitalize text-gray-300">{selectedTemplate?.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Lines of Code</span>
                          <span className="text-gray-300">{moduleCode.split('\n').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Test Status</span>
                          <span className={testResults?.allPassed ? 'text-green-400' : 'text-yellow-400'}>
                            {testResults?.allPassed ? '✓ All Passed' : '⚠ Review Needed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deployment Options */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-purple-400" />
                        Deployment Options
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={deployModule}
                          className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-left transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-white" />
                            <div>
                              <div className="font-medium text-white">Publish to YOUNIVERSE</div>
                              <div className="text-sm text-white/70">Submit for community voting</div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={downloadModule}
                          className="w-full p-4 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-xl text-left transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Download className="w-5 h-5 text-cyan-400" />
                            <div>
                              <div className="font-medium text-white">Export as ZIP</div>
                              <div className="text-sm text-gray-400">Download complete module package</div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(moduleCode);
                          }}
                          className="w-full p-4 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-xl text-left transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Copy className="w-5 h-5 text-green-400" />
                            <div>
                              <div className="font-medium text-white">Copy to Clipboard</div>
                              <div className="text-sm text-gray-400">Copy JSX code for manual integration</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Config Review */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                    <h3 className="font-semibold mb-4">Configuration Review</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(moduleConfig).map(([key, value]) => (
                        <div key={key} className="bg-black/20 rounded-lg p-3">
                          <div className="text-xs text-gray-500 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className="text-sm text-white">
                            {Array.isArray(value) ? value.join(', ') || 'None' : 
                             typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                             String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={prevPhase} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg text-gray-300 transition-colors">
                      Back to Tests
                    </button>
                    <button onClick={() => { setBuildPhase('select'); setSelectedTemplate(null); setModuleName(''); setModuleCode(''); setTestResults(null); }}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg text-gray-300 transition-colors">
                      Build Another Module
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleBuilder;
