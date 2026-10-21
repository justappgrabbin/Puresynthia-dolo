// ============================================================================
// SYNTHIA LIFE ENGINE — REACT UI COMPONENT
// Interactive Dramatized Life Video Experience
// Based on GameFactory architecture adapted for Human Design
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DesignToWorldMapper, 
  WorldParameters, 
  CharacterParams, 
  DecisionNode,
  RelationshipParams 
} from './design-to-world-mapper';
import { 
  DesignDecisionController, 
  DDC_CONFIG 
} from './design-decision-controller';
import { 
  LifeVideoDiffusionModel, 
  VIDEO_CONFIG 
} from './video-diffusion-backbone';
import { 
  LifeEpisodeDataset, 
  LifeEpisode, 
  EpisodeDecisionPoint 
} from './life-episode-dataset';
import { HDChart, Gate, Channel, Center, PlanetPosition } from './hd-types';

// ============================================================================
// STYLES (CSS-in-JS for portability)
// ============================================================================

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    background: '#0a0a0f',
    color: '#e0e0e0',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },

  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #1a1a2e',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
  },

  title: {
    fontSize: '20px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },

  subtitle: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },

  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },

  // Left panel: World/Character info
  leftPanel: {
    width: '280px',
    borderRight: '1px solid #1a1a2e',
    background: '#0f0f1a',
    overflowY: 'auto' as const,
    padding: '16px',
  },

  panelTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#a78bfa',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },

  infoCard: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '12px',
    border: '1px solid #2a2a3e',
  },

  infoLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },

  infoValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#e0e0e0',
  },

  characterCard: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '8px',
    border: '1px solid #2a2a3e',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  characterName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#e0e0e0',
  },

  characterRole: {
    fontSize: '11px',
    color: '#a78bfa',
  },

  characterTrait: {
    fontSize: '10px',
    color: '#6b7280',
    marginTop: '4px',
  },

  // Center: Video player + decision overlay
  centerPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
  },

  videoContainer: {
    flex: 1,
    position: 'relative' as const,
    background: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoPlaceholder: {
    width: '360px',
    height: '640px',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px dashed #2a2a3e',
  },

  videoPlaceholderText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center' as const,
    padding: '20px',
  },

  videoFrame: {
    width: '360px',
    height: '640px',
    borderRadius: '16px',
    objectFit: 'cover' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },

  // Decision overlay
  decisionOverlay: {
    position: 'absolute' as const,
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '340px',
    background: 'rgba(10, 10, 15, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid rgba(167, 139, 250, 0.2)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
  },

  decisionPrompt: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#e0e0e0',
    marginBottom: '16px',
    lineHeight: 1.4,
  },

  decisionTimer: {
    fontSize: '12px',
    color: '#f59e0b',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  decisionOption: {
    background: 'rgba(26, 26, 46, 0.8)',
    border: '1px solid #2a2a3e',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  decisionOptionText: {
    fontSize: '13px',
    color: '#e0e0e0',
    flex: 1,
  },

  decisionOptionAlignment: {
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: 600,
  },

  alignedBadge: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
  },

  partialBadge: {
    background: 'rgba(251, 191, 36, 0.2)',
    color: '#fbbf24',
  },

  notSelfBadge: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
  },

  // Right panel: Stats/Metrics
  rightPanel: {
    width: '260px',
    borderLeft: '1px solid #1a1a2e',
    background: '#0f0f1a',
    overflowY: 'auto' as const,
    padding: '16px',
  },

  metricCard: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '12px',
    border: '1px solid #2a2a3e',
  },

  metricValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#e0e0e0',
  },

  metricLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginTop: '4px',
  },

  metricBar: {
    height: '6px',
    background: '#2a2a3e',
    borderRadius: '3px',
    marginTop: '8px',
    overflow: 'hidden',
  },

  metricBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },

  // Bottom bar: Controls
  bottomBar: {
    height: '60px',
    borderTop: '1px solid #1a1a2e',
    background: '#0f0f1a',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: '16px',
  },

  controlButton: {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: '10px',
    padding: '8px 16px',
    color: '#e0e0e0',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  progressBar: {
    flex: 1,
    height: '4px',
    background: '#2a2a3e',
    borderRadius: '2px',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },

  // Loading state
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(10, 10, 15, 0.9)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '3px solid #2a2a3e',
    borderTop: '3px solid #a78bfa',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  loadingText: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#a78bfa',
  },

  // Emotional state indicator
  emotionalState: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    background: 'rgba(10, 10, 15, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '10px 14px',
    border: '1px solid rgba(167, 139, 250, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  emotionalDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'all 0.5s ease',
  },

  emotionalLabel: {
    fontSize: '12px',
    color: '#e0e0e0',
  },

  // Gate activation indicator
  gateIndicator: {
    position: 'absolute' as const,
    top: '16px',
    left: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },

  gateBadge: {
    background: 'rgba(10, 10, 15, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    padding: '6px 10px',
    border: '1px solid rgba(167, 139, 250, 0.2)',
    fontSize: '11px',
    color: '#a78bfa',
    fontWeight: 600,
  },

  // Episode selector
  episodeSelector: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto' as const,
    padding: '8px 0',
  },

  episodeThumbnail: {
    minWidth: '120px',
    height: '68px',
    background: '#1a1a2e',
    borderRadius: '10px',
    border: '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px',
    transition: 'all 0.2s',
  },

  episodeThumbnailTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#e0e0e0',
    textAlign: 'center' as const,
  },

  episodeThumbnailStatus: {
    fontSize: '9px',
    color: '#6b7280',
    marginTop: '2px',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SynthiaLifeEngineProps {
  chart: HDChart;
  onEpisodeComplete?: (episode: LifeEpisode) => void;
  onDecision?: (decision: string, alignment: number) => void;
}

export const SynthiaLifeEngine: React.FC<SynthiaLifeEngineProps> = ({
  chart,
  onEpisodeComplete,
  onDecision,
}) => {
  // State
  const [world, setWorld] = useState<WorldParameters | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<LifeEpisode | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDecision, setCurrentDecision] = useState<EpisodeDecisionPoint | null>(null);
  const [decisionTimer, setDecisionTimer] = useState(0);
  const [episodeHistory, setEpisodeHistory] = useState<LifeEpisode[]>([]);
  const [satisfactionScore, setSatisfactionScore] = useState(0.5);
  const [alignmentScore, setAlignmentScore] = useState(0.5);
  const [emotionalState, setEmotionalState] = useState('flow');
  const [activeGates, setActiveGates] = useState<number[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterParams | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef<number>(0);

  // Initialize world from chart
  useEffect(() => {
    const mapper = new DesignToWorldMapper(/* cognitiveEngine */);
    const worldParams = mapper.mapChartToWorld(chart);
    setWorld(worldParams);

    // Generate initial episode
    generateEpisode(worldParams, 'initial encounter');
  }, [chart]);

  // Generate new episode
  const generateEpisode = useCallback(async (worldParams: WorldParameters, scenario: string) => {
    setIsLoading(true);

    // In production: call the video diffusion model
    // For now: generate synthetic episode data
    const dataset = new LifeEpisodeDataset(/* mapper */);
    const episode = dataset.generateEpisode(chart, scenario, 120);

    setCurrentEpisode(episode);
    setCurrentFrame(0);
    setIsLoading(false);
    setIsPlaying(true);

    // Start frame progression
    startFrameProgression(episode);
  }, [chart]);

  // Frame progression
  const startFrameProgression = useCallback((episode: LifeEpisode) => {
    const totalFrames = episode.videoFrames.shape[0];
    const fps = episode.frameRate;
    const interval = 1000 / fps;

    const progress = () => {
      frameRef.current += 1;

      if (frameRef.current >= totalFrames) {
        // Episode complete
        setIsPlaying(false);
        onEpisodeComplete?.(episode);
        return;
      }

      setCurrentFrame(frameRef.current);

      // Check for decision points
      const decisionPoint = episode.decisionPoints.find(
        dp => Math.abs(dp.timestamp - frameRef.current) < 2
      );

      if (decisionPoint && !currentDecision) {
        setCurrentDecision(decisionPoint);
        setDecisionTimer(10);  // 10 seconds to decide
        setIsPlaying(false);

        // Start decision timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setDecisionTimer(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              // Auto-select aligned option
              handleDecision(decisionPoint.alignedChoice, decisionPoint);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      // Update emotional state from frame annotations
      const annotation = episode.frameAnnotations[frameRef.current];
      if (annotation) {
        setEmotionalState(annotation.emotionalState);
        setActiveGates(annotation.activeGates);
      }

      requestAnimationFrame(progress);
    };

    requestAnimationFrame(progress);
  }, [currentDecision, onEpisodeComplete]);

  // Handle decision
  const handleDecision = useCallback((optionId: string, decisionPoint: EpisodeDecisionPoint) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const option = decisionPoint.options.find(o => o.id === optionId);
    if (!option) return;

    // Update scores
    const newAlignment = (alignmentScore * currentEpisode!.decisionPoints.indexOf(decisionPoint) + option.alignment) / 
      (currentEpisode!.decisionPoints.indexOf(decisionPoint) + 1);
    setAlignmentScore(newAlignment);

    const newSatisfaction = newAlignment > 0.7 ? 
      Math.min(satisfactionScore + 0.1, 1.0) : 
      Math.max(satisfactionScore - 0.1, 0.0);
    setSatisfactionScore(newSatisfaction);

    // Notify parent
    onDecision?.(option.action, option.alignment);

    // Clear decision and resume
    setCurrentDecision(null);
    setIsPlaying(true);

    // Continue frame progression
    startFrameProgression(currentEpisode!);
  }, [alignmentScore, satisfactionScore, currentEpisode, onDecision, startFrameProgression]);

  // Pause/Play
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Generate next episode
  const generateNextEpisode = useCallback(() => {
    if (!world) return;

    const scenarios = [
      'workplace challenge',
      'relationship crossroads',
      'creative breakthrough',
      'family dynamics',
      'social gathering',
      'personal retreat',
      'unexpected opportunity',
      'conflict resolution',
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    generateEpisode(world, scenario);
  }, [world, generateEpisode]);

  // Render character list
  const renderCharacters = () => {
    if (!world) return null;

    return world.characters.map((char, idx) => (
      <div 
        key={char.id}
        style={{
          ...styles.characterCard,
          borderColor: selectedCharacter?.id === char.id ? '#a78bfa' : '#2a2a3e',
        }}
        onClick={() => setSelectedCharacter(char)}
      >
        <div style={styles.characterName}>{char.name}</div>
        <div style={styles.characterRole}>{char.role}</div>
        <div style={styles.characterTrait}>
          {char.behaviorPattern} • {char.motivation}
        </div>
      </div>
    ));
  };

  // Render decision options
  const renderDecisionOptions = () => {
    if (!currentDecision) return null;

    return currentDecision.options.map(option => {
      let badgeStyle = styles.partialBadge;
      if (option.alignment >= 0.9) badgeStyle = styles.alignedBadge;
      if (option.alignment <= 0.3) badgeStyle = styles.notSelfBadge;

      return (
        <div
          key={option.id}
          style={styles.decisionOption}
          onClick={() => handleDecision(option.id, currentDecision)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#a78bfa';
            e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a2a3e';
            e.currentTarget.style.background = 'rgba(26, 26, 46, 0.8)';
          }}
        >
          <span style={styles.decisionOptionText}>{option.text}</span>
          <span style={{ ...styles.decisionOptionAlignment, ...badgeStyle }}>
            {option.alignment >= 0.9 ? 'Aligned' : option.alignment >= 0.5 ? 'Partial' : 'Not-Self'}
          </span>
        </div>
      );
    });
  };

  // Render metrics
  const renderMetrics = () => {
    return (
      <>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{(satisfactionScore * 100).toFixed(0)}%</div>
          <div style={styles.metricLabel}>Satisfaction</div>
          <div style={styles.metricBar}>
            <div style={{
              ...styles.metricBarFill,
              width: `${satisfactionScore * 100}%`,
              background: satisfactionScore > 0.7 ? '#22c55e' : satisfactionScore > 0.4 ? '#fbbf24' : '#ef4444',
            }} />
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{(alignmentScore * 100).toFixed(0)}%</div>
          <div style={styles.metricLabel}>Design Alignment</div>
          <div style={styles.metricBar}>
            <div style={{
              ...styles.metricBarFill,
              width: `${alignmentScore * 100}%`,
              background: alignmentScore > 0.7 ? '#22c55e' : alignmentScore > 0.4 ? '#fbbf24' : '#ef4444',
            }} />
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{currentEpisode?.decisionPoints.length || 0}</div>
          <div style={styles.metricLabel}>Decision Points</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{episodeHistory.length}</div>
          <div style={styles.metricLabel}>Episodes Completed</div>
        </div>
      </>
    );
  };

  // Get emotional color
  const getEmotionalColor = () => {
    const colors: Record<string, string> = {
      'flow': '#22c55e',
      'anticipatory tension': '#f59e0b',
      'satisfaction': '#22c55e',
      'frustration': '#ef4444',
      'confusion': '#a78bfa',
      'clarity': '#3b82f6',
    };
    return colors[emotionalState] || '#6b7280';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Synthia Life Engine</div>
          <div style={styles.subtitle}>
            {chart.type} • {chart.profile} • {chart.authority} Authority
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {currentEpisode?.title || 'Ready to begin'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Left Panel: World Info */}
        <div style={styles.leftPanel}>
          <div style={styles.panelTitle}>Your World</div>

          {world && (
            <>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Setting</div>
                <div style={styles.infoValue}>{world.environment.setting}</div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Atmosphere</div>
                <div style={styles.infoValue}>{world.environment.atmosphere}</div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Life Theme</div>
                <div style={styles.infoValue}>{world.narrativeArchetype.lifeTheme}</div>
              </div>

              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Challenge</div>
                <div style={styles.infoValue}>{world.narrativeArchetype.challenge}</div>
              </div>

              <div style={styles.panelTitle} style={{ ...styles.panelTitle, marginTop: '20px' }}>
                Characters
              </div>
              {renderCharacters()}
            </>
          )}
        </div>

        {/* Center Panel: Video + Decisions */}
        <div style={styles.centerPanel}>
          <div style={styles.videoContainer}>
            {/* Video Frame */}
            {isLoading ? (
              <div style={styles.loadingOverlay}>
                <div style={styles.loadingSpinner} />
                <div style={styles.loadingText}>Generating your world...</div>
              </div>
            ) : currentEpisode ? (
              <>
                {/* Gate indicators */}
                <div style={styles.gateIndicator}>
                  {activeGates.map(gate => (
                    <div key={gate} style={styles.gateBadge}>
                      Gate {gate}
                    </div>
                  ))}
                </div>

                {/* Emotional state */}
                <div style={styles.emotionalState}>
                  <div style={{
                    ...styles.emotionalDot,
                    background: getEmotionalColor(),
                    boxShadow: `0 0 10px ${getEmotionalColor()}`,
                  }} />
                  <span style={styles.emotionalLabel}>{emotionalState}</span>
                </div>

                {/* Video placeholder — in production, this would be actual video */}
                <div style={styles.videoPlaceholder}>
                  <div style={styles.videoPlaceholderText}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
                    <div>Episode: {currentEpisode.title}</div>
                    <div style={{ fontSize: '12px', marginTop: '8px', color: '#6b7280' }}>
                      Frame {currentFrame} / {currentEpisode.videoFrames.shape[0]}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px', color: '#a78bfa' }}>
                      {currentEpisode.frameAnnotations[currentFrame]?.textDescription.substring(0, 60)}...
                    </div>
                  </div>
                </div>

                {/* Decision Overlay */}
                {currentDecision && (
                  <div style={styles.decisionOverlay}>
                    <div style={styles.decisionPrompt}>
                      {currentDecision.prompt}
                    </div>
                    <div style={styles.decisionTimer}>
                      <span>⏱️</span>
                      <span>Decide in {decisionTimer}s</span>
                    </div>
                    {renderDecisionOptions()}
                  </div>
                )}
              </>
            ) : (
              <div style={styles.videoPlaceholder}>
                <div style={styles.videoPlaceholderText}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                  <div>Your world is ready</div>
                  <div style={{ fontSize: '12px', marginTop: '8px', color: '#6b7280' }}>
                    Click "New Episode" to begin
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Episode Selector */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid #1a1a2e' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              Episode History
            </div>
            <div style={styles.episodeSelector}>
              {episodeHistory.map((ep, idx) => (
                <div 
                  key={ep.id} 
                  style={{
                    ...styles.episodeThumbnail,
                    borderColor: currentEpisode?.id === ep.id ? '#a78bfa' : 'transparent',
                  }}
                >
                  <div style={styles.episodeThumbnailTitle}>{ep.title}</div>
                  <div style={styles.episodeThumbnailStatus}>
                    {ep.outcome.alignmentScore > 0.7 ? '✓ Aligned' : '⚠ Learning'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Metrics */}
        <div style={styles.rightPanel}>
          <div style={styles.panelTitle}>Your Journey</div>
          {renderMetrics()}

          <div style={{ ...styles.panelTitle, marginTop: '20px' }}>Design Mechanics</div>

          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Strategy</div>
            <div style={styles.infoValue}>{chart.strategy}</div>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Authority</div>
            <div style={styles.infoValue}>{chart.authority}</div>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Type</div>
            <div style={styles.infoValue}>{chart.type}</div>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Profile</div>
            <div style={styles.infoValue}>{chart.profile}</div>
          </div>

          {selectedCharacter && (
            <>
              <div style={{ ...styles.panelTitle, marginTop: '20px' }}>
                Character Detail
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Name</div>
                <div style={styles.infoValue}>{selectedCharacter.name}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Role</div>
                <div style={styles.infoValue}>{selectedCharacter.role}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Motivation</div>
                <div style={styles.infoValue}>{selectedCharacter.motivation}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Cognitive Style</div>
                <div style={styles.infoValue}>{selectedCharacter.cognitiveStyle}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Bar: Controls */}
      <div style={styles.bottomBar}>
        <button style={styles.controlButton} onClick={togglePlay}>
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>

        <button style={styles.controlButton} onClick={generateNextEpisode}>
          🎬 New Episode
        </button>

        <div style={styles.progressBar}>
          <div style={{
            ...styles.progressFill,
            width: currentEpisode ? 
              `${(currentFrame / currentEpisode.videoFrames.shape[0]) * 100}%` : '0%',
          }} />
        </div>

        <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '80px', textAlign: 'right' }}>
          {currentEpisode ? 
            `${Math.floor(currentFrame / 24)}s / ${Math.floor(currentEpisode.videoFrames.shape[0] / 24)}s` : 
            '0s / 0s'
          }
        </span>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// CHARACTER DETAIL MODAL
// ============================================================================

interface CharacterDetailModalProps {
  character: CharacterParams;
  onClose: () => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  onClose,
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 10, 15, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 200,
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '20px',
        padding: '32px',
        width: '480px',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '1px solid #2a2a3e',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#e0e0e0', fontSize: '20px' }}>{character.name}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={styles.infoLabel}>Role</div>
          <div style={{ ...styles.infoValue, fontSize: '16px' }}>{character.role}</div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={styles.infoLabel}>Archetype</div>
          <div style={{ ...styles.infoValue, fontSize: '16px' }}>{character.archetype}</div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={styles.infoLabel}>Appearance</div>
          <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: 1.6 }}>
            <p><strong>Body Type:</strong> {character.appearance.bodyType}</p>
            <p><strong>Build:</strong> {character.appearance.build}</p>
            <p><strong>Movement:</strong> {character.appearance.movementStyle}</p>
            <p><strong>Dominant Feature:</strong> {character.appearance.dominantFeature}</p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={styles.infoLabel}>Personality</div>
          <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: 1.6 }}>
            <p><strong>Dominant Trait:</strong> {character.personality.dominantTrait}</p>
            <p><strong>Shadow:</strong> {character.personality.shadowTrait}</p>
            <p><strong>Growth Edge:</strong> {character.personality.growthEdge}</p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={styles.infoLabel}>Design Source</div>
          <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: 1.6 }}>
            <p><strong>Planetary Source:</strong> {character.planetarySource}</p>
            <p><strong>Zodiac Influence:</strong> {character.zodiacInfluence}</p>
            <p><strong>House Domain:</strong> {character.houseDomain}</p>
            <p><strong>Degree Precision:</strong> {character.degreePrecision.toFixed(2)}°</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EPISODE COMPLETION SUMMARY
// ============================================================================

interface EpisodeSummaryProps {
  episode: LifeEpisode;
  onNextEpisode: () => void;
  onReview: () => void;
}

export const EpisodeSummary: React.FC<EpisodeSummaryProps> = ({
  episode,
  onNextEpisode,
  onReview,
}) => {
  const { outcome } = episode;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 10, 15, 0.95)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 200,
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '20px',
        padding: '40px',
        width: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid #2a2a3e',
      }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#e0e0e0', fontSize: '24px' }}>
          Episode Complete
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
          {episode.title}
        </p>

        {/* Alignment Score */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#e0e0e0', fontSize: '14px' }}>Design Alignment</span>
            <span style={{ 
              color: outcome.alignmentScore > 0.7 ? '#22c55e' : outcome.alignmentScore > 0.4 ? '#fbbf24' : '#ef4444',
              fontWeight: 600,
              fontSize: '14px',
            }}>
              {(outcome.alignmentScore * 100).toFixed(0)}%
            </span>
          </div>
          <div style={styles.metricBar}>
            <div style={{
              ...styles.metricBarFill,
              width: `${outcome.alignmentScore * 100}%`,
              background: outcome.alignmentScore > 0.7 ? '#22c55e' : outcome.alignmentScore > 0.4 ? '#fbbf24' : '#ef4444',
            }} />
          </div>
        </div>

        {/* Satisfaction */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#e0e0e0', fontSize: '14px' }}>Satisfaction</span>
            <span style={{ 
              color: outcome.satisfaction > 0.7 ? '#22c55e' : outcome.satisfaction > 0.4 ? '#fbbf24' : '#ef4444',
              fontWeight: 600,
              fontSize: '14px',
            }}>
              {(outcome.satisfaction * 100).toFixed(0)}%
            </span>
          </div>
          <div style={styles.metricBar}>
            <div style={{
              ...styles.metricBarFill,
              width: `${outcome.satisfaction * 100}%`,
              background: outcome.satisfaction > 0.7 ? '#22c55e' : outcome.satisfaction > 0.4 ? '#fbbf24' : '#ef4444',
            }} />
          </div>
        </div>

        {/* Lessons Learned */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ ...styles.panelTitle, marginBottom: '12px' }}>Lessons Learned</div>
          {outcome.lessonsLearned.map((lesson, idx) => (
            <div key={idx} style={{
              background: '#0f0f1a',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
              fontSize: '13px',
              color: '#e0e0e0',
              lineHeight: 1.5,
            }}>
              <span style={{ color: '#a78bfa', marginRight: '8px' }}>💡</span>
              {lesson}
            </div>
          ))}
        </div>

        {/* Growth Indicators */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ ...styles.panelTitle, marginBottom: '12px' }}>Growth Indicators</div>
          {outcome.growthIndicators.map((indicator, idx) => (
            <div key={idx} style={{
              background: '#0f0f1a',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
              fontSize: '13px',
              color: '#e0e0e0',
              lineHeight: 1.5,
            }}>
              <span style={{ color: '#22c55e', marginRight: '8px' }}>🌱</span>
              {indicator}
            </div>
          ))}
        </div>

        {/* Narrative Closure */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(167, 139, 250, 0.2)',
        }}>
          <div style={{ fontSize: '13px', color: '#a78bfa', marginBottom: '4px' }}>Narrative Closure</div>
          <div style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: 1.5 }}>
            {outcome.narrativeClosure}
          </div>
        </div>

        {/* Next Episode Setup */}
        <div style={{
          background: '#0f0f1a',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Next Episode</div>
          <div style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: 1.5 }}>
            {outcome.nextEpisodeSetup}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onReview}
            style={{
              ...styles.controlButton,
              flex: 1,
              justifyContent: 'center',
            }}
          >
            🔍 Review Episode
          </button>
          <button 
            onClick={onNextEpisode}
            style={{
              ...styles.controlButton,
              flex: 1,
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              color: '#fff',
            }}
          >
            🎬 Next Episode
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default SynthiaLifeEngine;
