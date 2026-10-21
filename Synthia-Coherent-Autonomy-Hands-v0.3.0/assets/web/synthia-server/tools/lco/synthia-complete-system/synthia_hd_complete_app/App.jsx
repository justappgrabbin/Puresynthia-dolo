import React, { useState, useEffect, useRef } from 'react';
import { AutopoeticResonanceEngine } from './engine/AutopoeticResonanceEngine';
import './App.css';

function App() {
  const [engine, setEngine] = useState(null);
  const [engineStatus, setEngineStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [persons, setPersons] = useState([]);
  const [hypotheses, setHypotheses] = useState([]);
  const [papers, setPapers] = useState([]);
  const [memories, setMemories] = useState([]);
  const [currentMode, setCurrentMode] = useState(null);
  const [agentEmotion, setAgentEmotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const engineRef = useRef(null);

  // Initialize engine on mount
  useEffect(() => {
    async function init() {
      const are = new AutopoeticResonanceEngine();
      await are.birth();
      engineRef.current = are;
      setEngine(are);
      setEngineStatus(are.getStatus());
      setAgentEmotion(are.purposeCore.getAgentEmotion());
      setLoading(false);
    }
    init();
  }, []);

  // Auto-refresh status
  useEffect(() => {
    if (!engine) return;
    const interval = setInterval(() => {
      setEngineStatus(engine.getStatus());
      setAgentEmotion(engine.purposeCore.getAgentEmotion());
    }, 5000);
    return () => clearInterval(interval);
  }, [engine]);

  // Register a person
  const registerPerson = async (e) => {
    e.preventDefault();
    const form = e.target;
    const personId = form.personId.value;
    const name = form.name.value;
    const purpose = form.purpose.value;

    const indicators = [];
    for (let i = 1; i <= 3; i++) {
      const indName = form[`indicator_${i}_name`].value;
      const indMeasure = form[`indicator_${i}_measure`].value;
      const indDir = form[`indicator_${i}_direction`].value;
      if (indName) {
        indicators.push({ name: indName, measure: indMeasure, direction: indDir });
      }
    }

    const profile = {
      name,
      purpose: purpose ? { statement: purpose, indicators } : null,
      registeredAt: Date.now()
    };

    await engine.registerPerson(personId, profile);
    setPersons([...persons, { id: personId, ...profile }]);
    setMessage(`Registered ${name} (${personId})`);
    form.reset();
  };

  // Record progress
  const recordProgress = async (e) => {
    e.preventDefault();
    const form = e.target;
    const personId = form.personId.value;
    const indicator = form.indicator.value;
    const value = parseFloat(form.value.value);

    const result = await engine.recordProgress(personId, indicator, value, {
      note: form.note.value,
      chnops: form.chnops.value ? JSON.parse(form.chnops.value) : null
    });

    setMessage(`Progress recorded: ${indicator} = ${value} (${result.progress.direction})`);
    setAgentEmotion(result.agentEmotion);
    form.reset();
  };

  // Generate hypothesis
  const generateHypothesis = async () => {
    if (persons.length < 2) {
      setMessage('Need at least 2 registered persons to generate hypothesis');
      return;
    }

    const hypothesis = await engine.generateHypothesis(persons[0].id, persons[1].id, {
      timeframe: 'ongoing',
      observationCount: memories.length
    });

    setHypotheses([...hypotheses, hypothesis]);
    setMessage(`Generated hypothesis: ${hypothesis.title}`);
  };

  // Record observation
  const recordObservation = async (e) => {
    e.preventDefault();
    const form = e.target;
    const hypothesisId = form.hypothesisId.value;
    const description = form.description.value;

    const result = await engine.recordObservation(hypothesisId, {
      description,
      chnops: form.chnops.value ? JSON.parse(form.chnops.value) : null
    });

    setMessage(`Observation recorded. Confidence: ${(result.currentConfidence * 100).toFixed(1)}%. Status: ${result.status}`);
    form.reset();
  };

  // Generate paper
  const generatePaper = async (hypothesisId) => {
    const paper = await engine.generatePaper(hypothesisId, 'markdown');
    setPapers([...papers, { hypothesisId, content: paper, generatedAt: Date.now() }]);
    setMessage('Paper generated in Markdown format');
  };

  // Teach the engine
  const teach = async (e) => {
    e.preventDefault();
    const form = e.target;
    const content = form.content.value;
    const source = form.source.value;

    const result = await engine.teach(content, source);
    setMessage(`Taught from ${source}. Agent feels ${result.agentEmotion.dominant}. ${result.newQuestions.length} new questions spawned.`);
    setAgentEmotion(result.agentEmotion);
    form.reset();
  };

  // Remember something
  const remember = async (e) => {
    e.preventDefault();
    const form = e.target;
    const personId = form.personId.value;
    const content = form.content.value;
    const type = form.type.value;

    const memory = await engine.remember(personId, {
      type,
      content: { text: content, topic: form.topic.value },
      context: { emotion: form.emotion.value },
      importance: parseFloat(form.importance.value) || 0.5
    });

    setMemories([...memories, memory]);
    setMessage(`Memory stored: ${memory.id}`);
    form.reset();
  };

  // Recall memories
  const recall = async (e) => {
    e.preventDefault();
    const form = e.target;
    const personId = form.personId.value;
    const query = form.query.value;

    const results = await engine.recall(personId, query, { limit: 10 });
    setMemories(results);
    setMessage(`Recalled ${results.length} memories`);
  };

  // Become complementary
  const becomeComplementary = async (e) => {
    e.preventDefault();
    const form = e.target;
    const personId = form.personId.value;
    const situation = {
      type: form.situationType.value,
      topic: form.topic.value
    };

    const mode = await engine.becomeComplementary(personId, situation);
    setCurrentMode(mode);
    setMessage(`Agent is now in ${mode.mode} mode: ${mode.voice}`);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-pulse">Conceiving Autopoetic Resonance Engine...</div>
        <div className="loading-sub">Initializing biochemical cognition layers</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Autopoetic Resonance Engine v7.0</h1>
        <div className="agent-vitals">
          <span className={`status-badge ${engineStatus?.state}`}>
            {engineStatus?.state?.toUpperCase()}
          </span>
          <span className="emotion-badge">
            Agent: {agentEmotion?.dominant} ({(agentEmotion?.intensity * 100).toFixed(0)}%)
          </span>
          <span className="knowledge-badge">
            Knowledge: {engineStatus?.knowledgeSize} nodes
          </span>
        </div>
      </header>

      {message && (
        <div className="message-bar" onClick={() => setMessage('')}>
          {message}
        </div>
      )}

      <nav className="tab-nav">
        {['dashboard', 'persons', 'progress', 'hypotheses', 'papers', 'memory', 'teach', 'complementary'].map(tab => (
          <button 
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>Engine Dashboard</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{engineStatus?.state}</div>
                <div className="stat-label">State</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{engineStatus?.registeredPersons}</div>
                <div className="stat-label">Persons</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{engineStatus?.activeHypotheses}</div>
                <div className="stat-label">Hypotheses</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{engineStatus?.papersGenerated}</div>
                <div className="stat-label">Papers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{engineStatus?.knowledgeSize}</div>
                <div className="stat-label">Knowledge Nodes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{Math.round((Date.now() - (engineStatus?.birthTime || Date.now())) / 1000)}s</div>
                <div className="stat-label">Age</div>
              </div>
            </div>

            <div className="agent-emotion-panel">
              <h3>Agent Emotional State</h3>
              <div className="emotion-bars">
                {agentEmotion?.fullState && Object.entries(agentEmotion.fullState).map(([emotion, value]) => (
                  <div key={emotion} className="emotion-bar">
                    <span className="emotion-name">{emotion}</span>
                    <div className="emotion-track">
                      <div className="emotion-fill" style={{ width: `${value * 100}%`, background: getEmotionColor(emotion) }} />
                    </div>
                    <span className="emotion-value">{(value * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {currentMode && (
              <div className="complementary-panel">
                <h3>Current Complementary Mode</h3>
                <div className="mode-card">
                  <div className="mode-name">{currentMode.mode}</div>
                  <div className="mode-voice">Voice: {currentMode.voice}</div>
                  <div className="mode-behaviors">
                    {currentMode.behaviors.map(b => (
                      <span key={b} className="behavior-tag">{b}</span>
                    ))}
                  </div>
                  <div className="mode-actions">
                    <h4>Suggested Actions:</h4>
                    {currentMode.suggestedActions.map((action, i) => (
                      <div key={i} className="action-item">{action}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'persons' && (
          <div className="persons-panel">
            <h2>Register Person</h2>
            <form onSubmit={registerPerson} className="form">
              <div className="form-group">
                <label>Person ID</label>
                <input name="personId" placeholder="e.g., you, partner, system" required />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input name="name" placeholder="Display name" required />
              </div>
              <div className="form-group">
                <label>Purpose Statement</label>
                <textarea name="purpose" placeholder="What is this person's life direction?" rows="3" />
              </div>
              <div className="indicators-section">
                <h4>Progress Indicators (up to 3)</h4>
                {[1, 2, 3].map(i => (
                  <div key={i} className="indicator-row">
                    <input name={`indicator_${i}_name`} placeholder={`Indicator ${i} name`} />
                    <input name={`indicator_${i}_measure`} placeholder="How measured?" />
                    <select name={`indicator_${i}_direction`}>
                      <option value="increase">Increase</option>
                      <option value="decrease">Decrease</option>
                      <option value="maintain">Maintain</option>
                    </select>
                  </div>
                ))}
              </div>
              <button type="submit">Register Person</button>
            </form>

            <h3>Registered Persons</h3>
            <div className="persons-list">
              {persons.map(p => (
                <div key={p.id} className="person-card">
                  <div className="person-name">{p.name} <span className="person-id">({p.id})</span></div>
                  {p.purpose && (
                    <div className="person-purpose">
                      <strong>Purpose:</strong> {p.purpose.statement}
                      <div className="indicators">
                        {p.purpose.indicators.map(ind => (
                          <span key={ind.name} className="indicator-tag">
                            {ind.name} ({ind.direction})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="progress-panel">
            <h2>Record Progress</h2>
            <form onSubmit={recordProgress} className="form">
              <div className="form-group">
                <label>Person</label>
                <select name="personId" required>
                  <option value="">Select person...</option>
                  {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Indicator</label>
                <input name="indicator" placeholder="e.g., creative_output, relationship_quality" required />
              </div>
              <div className="form-group">
                <label>Value (numeric)</label>
                <input name="value" type="number" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Note</label>
                <textarea name="note" placeholder="Context for this measurement" rows="2" />
              </div>
              <div className="form-group">
                <label>CHNOPS Snapshot (optional JSON)</label>
                <textarea name="chnops" placeholder='{"C":0.3,"H":0.2,"N":0.15,"O":0.2,"S":0.1,"P":0.05}' rows="2" />
              </div>
              <button type="submit">Record Progress</button>
            </form>
          </div>
        )}

        {activeTab === 'hypotheses' && (
          <div className="hypotheses-panel">
            <h2>Scientific Hypotheses</h2>
            <button onClick={generateHypothesis} className="generate-btn">
              Generate New Hypothesis
            </button>

            <div className="hypotheses-list">
              {hypotheses.map(h => (
                <div key={h.id} className="hypothesis-card">
                  <div className="hypothesis-header">
                    <span className={`status-badge ${h.status}`}>{h.status}</span>
                    <span className="hypothesis-date">{new Date(h.generatedAt).toLocaleDateString()}</span>
                  </div>
                  <h3>{h.title}</h3>
                  <p className="hypothesis-abstract">{h.abstract}</p>
                  <div className="hypothesis-predictions">
                    <h4>Predicted Outcomes:</h4>
                    {h.predictedOutcomes.map((p, i) => (
                      <div key={i} className="prediction-item">{p}</div>
                    ))}
                  </div>
                  <div className="hypothesis-metrics">
                    <h4>Metrics:</h4>
                    {h.metrics.map((m, i) => (
                      <div key={i} className="metric-item">
                        <strong>{m.name}:</strong> {m.measure} (target: {m.target})
                      </div>
                    ))}
                  </div>
                  <div className="hypothesis-actions">
                    <button onClick={() => generatePaper(h.id)}>Generate Paper</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'papers' && (
          <div className="papers-panel">
            <h2>Generated Papers</h2>
            <div className="papers-list">
              {papers.map((p, i) => (
                <div key={i} className="paper-card">
                  <div className="paper-meta">
                    Hypothesis: {p.hypothesisId} | Generated: {new Date(p.generatedAt).toLocaleString()}
                  </div>
                  <pre className="paper-content">{p.content}</pre>
                  <button onClick={() => {
                    const blob = new Blob([p.content], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `paper_${p.hypothesisId}.md`;
                    a.click();
                  }}>Download Markdown</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="memory-panel">
            <h2>Memory System</h2>

            <div className="memory-sections">
              <div className="memory-section">
                <h3>Store Memory</h3>
                <form onSubmit={remember} className="form">
                  <div className="form-group">
                    <label>Person</label>
                    <select name="personId" required>
                      <option value="">Select person...</option>
                      {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select name="type">
                      <option value="episodic">Episodic (event)</option>
                      <option value="semantic">Semantic (fact)</option>
                      <option value="procedural">Procedural (skill)</option>
                      <option value="prospective">Prospective (future)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Content</label>
                    <textarea name="content" placeholder="What to remember..." rows="3" required />
                  </div>
                  <div className="form-group">
                    <label>Topic</label>
                    <input name="topic" placeholder="Categorization topic" />
                  </div>
                  <div className="form-group">
                    <label>Emotion</label>
                    <input name="emotion" placeholder="e.g., joy, concern, wonder" />
                  </div>
                  <div className="form-group">
                    <label>Importance (0-1)</label>
                    <input name="importance" type="number" min="0" max="1" step="0.1" defaultValue="0.5" />
                  </div>
                  <button type="submit">Remember</button>
                </form>
              </div>

              <div className="memory-section">
                <h3>Recall Memories</h3>
                <form onSubmit={recall} className="form">
                  <div className="form-group">
                    <label>Person</label>
                    <select name="personId" required>
                      <option value="">Select person...</option>
                      {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Query</label>
                    <input name="query" placeholder="What are you looking for?" required />
                  </div>
                  <button type="submit">Recall</button>
                </form>
              </div>
            </div>

            <h3>Stored Memories ({memories.length})</h3>
            <div className="memories-list">
              {memories.map(m => (
                <div key={m.id} className="memory-card">
                  <div className="memory-header">
                    <span className={`memory-type ${m.type}`}>{m.type}</span>
                    <span className="memory-importance">{(m.importance * 100).toFixed(0)}%</span>
                  </div>
                  <div className="memory-content">{JSON.stringify(m.content).substring(0, 200)}...</div>
                  <div className="memory-meta">
                    Accessed {m.accessCount} times | {new Date(m.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teach' && (
          <div className="teach-panel">
            <h2>Teach the Engine</h2>
            <form onSubmit={teach} className="form">
              <div className="form-group">
                <label>Source</label>
                <input name="source" placeholder="e.g., codon_mapping_pdf, personal_observation" required />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea name="content" placeholder="What knowledge to ingest..." rows="10" required />
              </div>
              <button type="submit">Teach</button>
            </form>
          </div>
        )}

        {activeTab === 'complementary' && (
          <div className="complementary-panel">
            <h2>Complementary Mode</h2>
            <form onSubmit={becomeComplementary} className="form">
              <div className="form-group">
                <label>Person</label>
                <select name="personId" required>
                  <option value="">Select person...</option>
                  {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Situation Type</label>
                <select name="situationType">
                  <option value="decision">Decision</option>
                  <option value="stress">Stress</option>
                  <option value="creative">Creative</option>
                  <option value="relational">Relational</option>
                  <option value="routine">Routine</option>
                </select>
              </div>
              <div className="form-group">
                <label>Topic</label>
                <input name="topic" placeholder="What is the situation about?" />
              </div>
              <button type="submit">Activate Complementary Mode</button>
            </form>

            {currentMode && (
              <div className="active-mode">
                <h3>Active Mode: {currentMode.mode}</h3>
                <div className="mode-details">
                  <p><strong>Voice:</strong> {currentMode.voice}</p>
                  <p><strong>Behaviors:</strong></p>
                  <ul>
                    {currentMode.behaviors.map(b => <li key={b}>{b}</li>)}
                  </ul>
                  <p><strong>Actions:</strong></p>
                  {currentMode.suggestedActions.map((action, i) => (
                    <div key={i} className="action-card">{action}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function getEmotionColor(emotion) {
  const colors = {
    joy: '#4CAF50',
    concern: '#FF9800',
    curiosity: '#2196F3',
    pride: '#9C27B0',
    wonder: '#00BCD4'
  };
  return colors[emotion] || '#999';
}

export default App;
