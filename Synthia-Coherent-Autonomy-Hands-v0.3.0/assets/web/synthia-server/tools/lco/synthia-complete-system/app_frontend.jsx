import React, { useState, useEffect } from 'react';
import './app.css';

export default function HDChartApp() {
  const [step, setStep] = useState('entry'); // 'entry' | 'chart' | 'question'
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Birth data form
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Question interface
  const [question, setQuestion] = useState('');

  // ============================================================
  // CITY AUTOCOMPLETE
  // ============================================================

  const handleCityInput = (value) => {
    setCity(value);
    if (value.length > 0) {
      fetch(`/api/cities?q=${value}`)
        .then(r => r.json())
        .then(data => {
          setCities(data);
          setShowCitySuggestions(true);
        });
    } else {
      setShowCitySuggestions(false);
    }
  };

  const selectCity = (c) => {
    setCity(c.name);
    setSelectedCity(c);
    setShowCitySuggestions(false);
  };

  // ============================================================
  // CHART CALCULATION
  // ============================================================

  const handleCalculateChart = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_local_tz: selectedCity?.tz || 'UTC+0',
          location: {
            lat: selectedCity?.lat || 0,
            lon: selectedCity?.lon || 0,
          },
        }),
      });

      if (!response.ok) throw new Error('Chart calculation failed');
      const data = await response.json();
      setChart(data);
      setStep('chart');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // QUESTION HANDLER
  // ============================================================

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || !chart) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/chart/${chart.name}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) throw new Error('Failed to get answer');
      const data = await response.json();
      
      // For now, just show the answer inline
      alert(`Q: ${data.question}\n\nA: ${data.answer}`);
      setQuestion('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER: BIRTH ENTRY
  // ============================================================

  if (step === 'entry') {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>Human Design Chart</h1>
          <p>Enter your birth data to see your design</p>
        </header>

        <form onSubmit={handleCalculateChart} className="form">
          {/* Name */}
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Celestial"
              required
            />
          </div>

          {/* Birth Date */}
          <div className="form-group">
            <label>Birth Date</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>

          {/* Birth Time */}
          <div className="form-group">
            <label>Birth Time (HH:MM)</label>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              required
            />
          </div>

          {/* City (with autocomplete) */}
          <div className="form-group autocomplete">
            <label>Birth City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => handleCityInput(e.target.value)}
              onFocus={() => city.length > 0 && setShowCitySuggestions(true)}
              placeholder="e.g., San Francisco"
              required
            />
            {showCitySuggestions && cities.length > 0 && (
              <div className="suggestions">
                {cities.map((c, idx) => (
                  <div
                    key={idx}
                    className="suggestion"
                    onClick={() => selectCity(c)}
                  >
                    {c.name} ({c.tz})
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading} className="button-primary">
            {loading ? 'Calculating...' : 'Calculate My Chart'}
          </button>
        </form>
      </div>
    );
  }

  // ============================================================
  // RENDER: CHART DISPLAY
  // ============================================================

  if (step === 'chart' && chart) {
    const c = chart.chart;
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>{chart.name}</h1>
          <p>Your Human Design</p>
        </header>

        {/* Type + Authority + Profile */}
        <section className="chart-summary">
          <div className="summary-card">
            <h3>Type</h3>
            <p className="type-name">{c.type}</p>
            <p className="type-desc">{chart.explanations.type}</p>
          </div>

          <div className="summary-card">
            <h3>Strategy</h3>
            <p className="strategy-name">{c.strategy}</p>
          </div>

          <div className="summary-card">
            <h3>Authority</h3>
            <p className="authority-name">{c.authority}</p>
            <p className="authority-desc">{chart.explanations.authority}</p>
          </div>

          <div className="summary-card">
            <h3>Profile</h3>
            <p className="profile-name">{c.profile}</p>
          </div>
        </section>

        {/* Defined Centers */}
        <section className="centers-section">
          <h3>Defined Centers</h3>
          <div className="centers-list">
            {c.defined_centers.length > 0 ? (
              c.defined_centers.map((center, idx) => (
                <div key={idx} className="center-badge">
                  {center}
                </div>
              ))
            ) : (
              <p className="no-data">All Centers Open</p>
            )}
          </div>
        </section>

        {/* Active Channels */}
        <section className="channels-section">
          <h3>Active Channels ({c.active_channels.length})</h3>
          <div className="channels-list">
            {c.active_channels.length > 0 ? (
              c.active_channels.map((ch, idx) => (
                <div key={idx} className="channel-badge">
                  {ch[0]} ↔ {ch[1]}
                </div>
              ))
            ) : (
              <p className="no-data">No Channels Active</p>
            )}
          </div>
        </section>

        {/* Three-Field Chart Basics */}
        <section className="fields-section">
          <h3>Your Three Fields</h3>

          <div className="field-card">
            <h4>Body (Tropical)</h4>
            <p>
              Sun: Gate {chart.fields.body.sun.gate} Line {chart.fields.body.sun.line}
            </p>
            <p>{chart.fields.body.sun.longitude}</p>
          </div>

          <div className="field-card">
            <h4>Mind (Sidereal - Fagan-Bradley)</h4>
            <p>
              Sun: Gate {chart.fields.mind.sun.gate} Line {chart.fields.mind.sun.line}
            </p>
            <p>{chart.fields.mind.sun.longitude}</p>
          </div>

          <div className="field-card">
            <h4>Heart (Draconic)</h4>
            <p>
              Sun: Gate {chart.fields.heart.sun.gate} Line {chart.fields.heart.sun.line}
            </p>
            <p>{chart.fields.heart.sun.longitude}</p>
          </div>
        </section>

        {/* Chat Interface */}
        <section className="chat-section">
          <h3>Ask About Your Chart</h3>
          <form onSubmit={handleAskQuestion} className="question-form">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What does my Type mean?"
              className="question-input"
            />
            <button type="submit" disabled={loading} className="button-primary">
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </form>
        </section>

        {/* Footer */}
        <footer className="app-footer">
          <button onClick={() => setStep('entry')} className="button-secondary">
            Calculate Another Chart
          </button>
        </footer>
      </div>
    );
  }

  return null;
}
