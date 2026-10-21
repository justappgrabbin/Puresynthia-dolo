/**
 * SynthAi API Service Layer
 * Bridges React frontend ↔ Python/C# backend
 * Handles all chart calculations, Klein narratives, tests, visuals
 */

import axios, { AxiosInstance } from 'axios';

export interface BirthData {
  name: string;
  birth_date: string; // YYYY-MM-DD
  birth_time: string; // HH:MM:SS
  latitude: number;
  longitude: number;
}

export interface ChartData {
  person: string;
  birth_date: string;
  tropical: Record<string, number>;
  sidereal: Record<string, number>;
  draconic: Record<string, number>;
  gates: number[];
  centers: Record<string, string>;
  incarnation_cross: string;
}

export interface CHNOPSVector {
  carbon: number;
  hydrogen: number;
  nitrogen: number;
  oxygen: number;
  phosphorus: number;
  sulfur: number;
  resonance_score: number;
}

export interface KleinInsight {
  question: string;
  answer: string;
  confidence: number;
  related_gates: number[];
  visualization?: string;
}

export interface TestResult {
  passed: boolean;
  duration_ms: number;
  output: string;
  assertions: number;
}

export interface GeneratedTest {
  test_code: string;
  test_type: 'unit' | 'integration' | 'e2e';
  executable: boolean;
}

export interface GeneratedReport {
  report: string;
  format: 'markdown';
  timestamp: string;
}

export interface VisualSpec {
  video_prompt: string;
  duration_seconds: number;
  style: string;
  ready_for_rendering: boolean;
}

class SynthAiService {
  private api: AxiosInstance;
  private currentChart: ChartData | null = null;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Health Check
   */
  async health() {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Backend health check failed: ${error}`);
    }
  }

  /**
   * Chart Calculations
   */
  async calculateChart(birthData: BirthData): Promise<ChartData> {
    try {
      const response = await this.api.post('/api/chart/calculate', {
        person1: birthData,
      });
      this.currentChart = response.data;
      return this.currentChart;
    } catch (error) {
      throw new Error(`Chart calculation failed: ${error}`);
    }
  }

  async calculateCHNOPS(chart: ChartData): Promise<CHNOPSVector> {
    try {
      const response = await this.api.post('/api/chart/chnops', chart);
      return response.data;
    } catch (error) {
      throw new Error(`CHNOPS calculation failed: ${error}`);
    }
  }

  getCurrentChart(): ChartData | null {
    return this.currentChart;
  }

  /**
   * Klein Narrative Engine
   */
  async generateNarrative(
    prompt: string,
    temperature: number = 0.7,
    maxLength: number = 500
  ): Promise<any> {
    if (!this.currentChart) {
      throw new Error('No chart loaded. Calculate chart first.');
    }

    try {
      const response = await this.api.post('/api/klein/narrative', {
        chart_data: this.currentChart,
        prompt,
        temperature,
        max_length: maxLength,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Narrative generation failed: ${error}`);
    }
  }

  async getInsight(question: string, context?: string): Promise<KleinInsight> {
    if (!this.currentChart) {
      throw new Error('No chart loaded. Calculate chart first.');
    }

    try {
      const response = await this.api.post('/api/klein/insight', {
        chart_data: this.currentChart,
        question,
        context: context || '',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Insight generation failed: ${error}`);
    }
  }

  async getGateInsight(gateNumber: number): Promise<KleinInsight> {
    return this.getInsight(
      `What does Gate ${gateNumber} mean in my chart? How does it shape my life?`
    );
  }

  /**
   * AutoNovel: Test Generation & Execution
   */
  async generateTest(
    scenario: string,
    testType: 'unit' | 'integration' | 'e2e' = 'unit'
  ): Promise<GeneratedTest> {
    if (!this.currentChart) {
      throw new Error('No chart loaded. Calculate chart first.');
    }

    try {
      const response = await this.api.post('/api/autonovel/generate-test', {
        scenario,
        test_type: testType,
        context: this.currentChart,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Test generation failed: ${error}`);
    }
  }

  async runTest(testCode: string): Promise<TestResult> {
    try {
      const response = await this.api.post('/api/autonovel/execute-test', {
        test_code: testCode,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Test execution failed: ${error}`);
    }
  }

  /**
   * AutoNovel: Report Generation
   */
  async generateReport(analysisType: string): Promise<GeneratedReport> {
    if (!this.currentChart) {
      throw new Error('No chart loaded. Calculate chart first.');
    }

    try {
      const response = await this.api.post('/api/autonovel/generate-report', {
        chart_data: this.currentChart,
        analysis_type: analysisType,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Report generation failed: ${error}`);
    }
  }

  /**
   * Magic Squares
   */
  async calculateMagicSquare(order: number, gates: number[]): Promise<any> {
    try {
      const response = await this.api.post('/api/magic-squares/calculate', {
        order,
        gates,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Magic square calculation failed: ${error}`);
    }
  }

  /**
   * Synthia: Visual Generation
   */
  async generateVisual(mood: string = 'creative'): Promise<VisualSpec> {
    if (!this.currentChart) {
      throw new Error('No chart loaded. Calculate chart first.');
    }

    try {
      const response = await this.api.post('/api/synthia/generate-visual', {
        chart_data: this.currentChart,
        mood,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Visual generation failed: ${error}`);
    }
  }

  /**
   * State Management
   */
  async saveState(state: Record<string, any>): Promise<any> {
    try {
      const response = await this.api.post('/api/state/save', state);
      return response.data;
    } catch (error) {
      throw new Error(`State save failed: ${error}`);
    }
  }

  async loadState(sessionId: string): Promise<Record<string, any>> {
    try {
      const response = await this.api.get(`/api/state/load/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(`State load failed: ${error}`);
    }
  }

  /**
   * Relationship Resonance
   */
  async calculateRelationshipResonance(
    yourChart: ChartData,
    otherBirthData: BirthData
  ): Promise<any> {
    try {
      const response = await this.api.post('/api/chart/calculate', {
        person1: yourChart,
        person2: otherBirthData,
        chart_type: 'relationship',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Relationship calculation failed: ${error}`);
    }
  }
}

// Singleton instance
export const synthAiService = new SynthAiService();

export default SynthAiService;
