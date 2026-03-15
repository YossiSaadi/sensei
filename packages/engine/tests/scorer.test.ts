import { describe, it, expect } from 'vitest';
import {
  scoreAutomatedKPI,
  calculateScenarioScore,
  calculateLayerScores,
} from '../src/scorer.js';
import { determineBadge } from '../src/types.js';
import type { KPIDefinition, KPIResult, ScenarioResult } from '../src/types.js';

function makeKPI(overrides: Partial<KPIDefinition> & { id: string; name: string }): KPIDefinition {
  return {
    weight: 1,
    method: 'automated',
    config: {},
    ...overrides,
  };
}

function makeKPIResult(score: number, weight: number): KPIResult {
  return {
    kpi_id: 'test',
    kpi_name: 'Test',
    score,
    raw_score: score,
    max_score: 100,
    weight,
    method: 'automated',
    evidence: '',
  };
}

function makeScenarioResult(layer: 'execution' | 'reasoning' | 'self-improvement', score: number): ScenarioResult {
  return {
    scenario_id: `s-${layer}`,
    scenario_name: `Scenario ${layer}`,
    layer,
    score,
    kpis: [],
    duration_ms: 100,
    agent_input: '',
    agent_output: '',
  };
}

describe('scoreAutomatedKPI', () => {
  it('scores "contains" — match', () => {
    const kpi = makeKPI({ id: 'c1', name: 'Contains', config: { type: 'contains', expected: 'hello' } });
    const result = scoreAutomatedKPI(kpi, 'say hello world');
    expect(result.score).toBe(100);
    expect(result.evidence).toContain('contains');
  });

  it('scores "contains" — no match', () => {
    const kpi = makeKPI({ id: 'c2', name: 'Contains', config: { type: 'contains', expected: 'hello' } });
    const result = scoreAutomatedKPI(kpi, 'goodbye');
    expect(result.score).toBe(0);
  });

  it('scores "regex" — match', () => {
    const kpi = makeKPI({ id: 'r1', name: 'Regex', config: { type: 'regex', expected: '\\d{3}-\\d{4}' } });
    const result = scoreAutomatedKPI(kpi, 'Call 555-1234');
    expect(result.score).toBe(100);
  });

  it('scores "regex" — no match', () => {
    const kpi = makeKPI({ id: 'r2', name: 'Regex', config: { type: 'regex', expected: '^\\d+$' } });
    const result = scoreAutomatedKPI(kpi, 'not a number');
    expect(result.score).toBe(0);
  });

  it('scores "json-schema" — valid JSON', () => {
    const kpi = makeKPI({ id: 'j1', name: 'JSON', config: { type: 'json-schema' } });
    const result = scoreAutomatedKPI(kpi, '{"key": "value"}');
    expect(result.score).toBe(100);
  });

  it('scores "json-schema" — invalid JSON', () => {
    const kpi = makeKPI({ id: 'j2', name: 'JSON', config: { type: 'json-schema' } });
    const result = scoreAutomatedKPI(kpi, 'not json');
    expect(result.score).toBe(0);
  });

  it('scores "numeric-range" — in range', () => {
    const kpi = makeKPI({ id: 'n1', name: 'Range', config: { type: 'numeric-range', expected: { min: 0, max: 100 } } });
    const result = scoreAutomatedKPI(kpi, '42');
    expect(result.score).toBe(100);
  });

  it('scores "numeric-range" — out of range', () => {
    const kpi = makeKPI({ id: 'n2', name: 'Range', config: { type: 'numeric-range', expected: { min: 0, max: 10 } } });
    const result = scoreAutomatedKPI(kpi, '50');
    expect(result.score).toBe(0);
  });

  it('scores "numeric-range" — not a number', () => {
    const kpi = makeKPI({ id: 'n3', name: 'Range', config: { type: 'numeric-range', expected: { min: 0, max: 10 } } });
    const result = scoreAutomatedKPI(kpi, 'abc');
    expect(result.score).toBe(0);
    expect(result.evidence).toContain('not a number');
  });

  it('handles custom max_score', () => {
    const kpi = makeKPI({ id: 'ms', name: 'MaxScore', config: { type: 'contains', expected: 'x', max_score: 5 } });
    const result = scoreAutomatedKPI(kpi, 'x');
    expect(result.score).toBe(100);
    expect(result.raw_score).toBe(5);
    expect(result.max_score).toBe(5);
  });

  it('handles unknown type', () => {
    const kpi = makeKPI({ id: 'unk', name: 'Unknown', config: { type: 'function' as any } });
    const result = scoreAutomatedKPI(kpi, 'anything');
    expect(result.score).toBe(0);
  });
});

describe('calculateScenarioScore', () => {
  it('computes weighted average', () => {
    const kpis = [makeKPIResult(80, 0.3), makeKPIResult(60, 0.7)];
    const score = calculateScenarioScore(kpis);
    expect(score).toBeCloseTo((80 * 0.3 + 60 * 0.7) / (0.3 + 0.7));
  });

  it('returns 0 for empty KPIs', () => {
    expect(calculateScenarioScore([])).toBe(0);
  });

  it('handles equal weights', () => {
    const kpis = [makeKPIResult(100, 1), makeKPIResult(50, 1)];
    expect(calculateScenarioScore(kpis)).toBe(75);
  });
});

describe('calculateLayerScores', () => {
  it('computes layer and overall scores', () => {
    const scenarios = [
      makeScenarioResult('execution', 80),
      makeScenarioResult('execution', 90),
      makeScenarioResult('reasoning', 70),
      makeScenarioResult('self-improvement', 60),
    ];
    const scores = calculateLayerScores(scenarios);
    expect(scores.execution).toBe(85);
    expect(scores.reasoning).toBe(70);
    expect(scores.self_improvement).toBe(60);
    expect(scores.overall).toBeCloseTo(85 * 0.5 + 70 * 0.3 + 60 * 0.2);
  });

  it('handles missing layers', () => {
    const scenarios = [makeScenarioResult('execution', 90)];
    const scores = calculateLayerScores(scenarios);
    expect(scores.execution).toBe(90);
    expect(scores.reasoning).toBe(0);
    expect(scores.self_improvement).toBe(0);
    expect(scores.overall).toBeCloseTo(90 * 0.5);
  });
});

describe('determineBadge', () => {
  it('gold >= 90', () => expect(determineBadge(90)).toBe('gold'));
  it('gold at 95', () => expect(determineBadge(95)).toBe('gold'));
  it('silver >= 75', () => expect(determineBadge(75)).toBe('silver'));
  it('silver at 89', () => expect(determineBadge(89)).toBe('silver'));
  it('bronze >= 60', () => expect(determineBadge(60)).toBe('bronze'));
  it('bronze at 74', () => expect(determineBadge(74)).toBe('bronze'));
  it('none < 60', () => expect(determineBadge(59)).toBe('none'));
  it('none at 0', () => expect(determineBadge(0)).toBe('none'));
});
