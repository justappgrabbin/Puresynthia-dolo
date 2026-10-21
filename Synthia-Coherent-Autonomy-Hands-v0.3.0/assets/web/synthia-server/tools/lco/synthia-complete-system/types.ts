/**
 * Synthia Kiosk — Universal Types
 */

export interface ActionStep {
  tool: string;
  params: Record<string, any>;
  validate?: (output: string) => boolean;
  onFail: 'retry' | 'skip' | 'rollback' | 'ask' | 'abort';
  maxRetries: number;
}

export interface ActionPlan {
  id: string;
  intent: string;
  steps: ActionStep[];
  rollbackSteps: ActionStep[];
  context: PlanContext;
  createdAt: number;
}

export interface PlanContext {
  intent: string;
  parsedType: string;
  confidence: number;
  sourceDevice: string;
  previousOutcomes: OutcomeRecord[];
}

export interface OutcomeRecord {
  planId: string;
  intent: string;
  success: boolean;
  failedStep?: number;
  errorMessage?: string;
  timestamp: number;
  learnings: string[];
}

export interface MemoryEntry {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface DeviceState {
  screenOn: boolean;
  orientation: 'portrait' | 'landscape';
  currentApp: string | null;
  batteryLevel: number;
  networkType: string;
  lastScreenshot: string | null;
}

export type IntentType = 
  | 'deploy' | 'fix' | 'setup' | 'install' | 'configure' 
  | 'monitor' | 'automate' | 'device_control' | 'query' | 'unknown';

export interface ParsedIntent {
  type: IntentType;
  raw: string;
  entities: string[];
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  plan?: ActionPlan;
  outcome?: { success: boolean; output: string };
}

export interface WebSocketMessage {
  type: 'chat' | 'intent' | 'status' | 'build' | 'deploy' | 'log' | 'device' | 'ping';
  payload: any;
}

// Trident component types
export interface TridentComponent {
  id: string;
  name: string;
  badge: string;
  badgeClass: string;
  desc: string;
  size: string;
  deps: string[];
  config: Record<string, ConfigField>;
}

export interface ConfigField {
  type: 'select' | 'number' | 'text' | 'checkbox';
  options?: string[];
  default: any;
  min?: number;
  max?: number;
  step?: number;
  label: string;
}

export interface TridentSlot {
  id: string;
  label: string;
  icon: string;
  accepts: string[];
}

export interface TridentPreset {
  name: string;
  icon: string;
  desc: string;
  comps: string[];
}
