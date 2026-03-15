import { describe, it, expect } from 'vitest';
import { toJSON, toTerminal } from '../src/reporter.js';
import type { SuiteResult } from '../src/types.js';

function makeSuiteResult(overrides?: Partial<SuiteResult>): SuiteResult {
  return {
    suite_id: 'test-suite',
    suite_version: '1.0.0',
    agent_id: 'test-agent',
    timestamp: '2025-01-01T00:00:00.000Z',
    scores: {
      overall: 82.5,
      execution: 90,
      reasoning: 75,
      self_improvement: 70,
    },
    scenarios: [
      {
        scenario_id: 's1',
        scenario_name: 'Email Writing',
        layer: 'execution',
        score: 90,
        kpis: [],
        duration_ms: 1200,
        agent_input: 'Write an email',
        agent_output: 'Dear...',
      },
      {
        scenario_id: 's2',
        scenario_name: 'Explain Strategy',
        layer: 'reasoning',
        score: 75,
        kpis: [],
        duration_ms: 800,
        agent_input: 'Why this approach?',
        agent_output: 'Because...',
      },
    ],
    badge: 'silver',
    duration_ms: 2500,
    judge_model: 'gpt-4o',
    ...overrides,
  };
}

describe('toJSON', () => {
  it('returns valid JSON string', () => {
    const result = makeSuiteResult();
    const json = toJSON(result);
    const parsed = JSON.parse(json);
    expect(parsed.suite_id).toBe('test-suite');
    expect(parsed.scores.overall).toBe(82.5);
    expect(parsed.badge).toBe('silver');
  });

  it('includes all scenarios', () => {
    const result = makeSuiteResult();
    const parsed = JSON.parse(toJSON(result));
    expect(parsed.scenarios).toHaveLength(2);
  });

  it('is pretty-printed', () => {
    const json = toJSON(makeSuiteResult());
    expect(json).toContain('\n');
    expect(json).toContain('  ');
  });
});

describe('toTerminal', () => {
  it('includes suite info', () => {
    const output = toTerminal(makeSuiteResult());
    expect(output).toContain('test-suite');
    expect(output).toContain('1.0.0');
    expect(output).toContain('test-agent');
  });

  it('includes scenario names', () => {
    const output = toTerminal(makeSuiteResult());
    expect(output).toContain('Email Writing');
    expect(output).toContain('Explain Strategy');
  });

  it('includes layer scores', () => {
    const output = toTerminal(makeSuiteResult());
    expect(output).toContain('Execution');
    expect(output).toContain('Reasoning');
    expect(output).toContain('Self-Improvement');
  });

  it('includes badge', () => {
    const output = toTerminal(makeSuiteResult());
    expect(output).toContain('Silver Badge');
  });

  it('shows judge model', () => {
    const output = toTerminal(makeSuiteResult());
    expect(output).toContain('gpt-4o');
  });

  it('handles no badge', () => {
    const output = toTerminal(makeSuiteResult({ badge: 'none' }));
    expect(output).toContain('No badge');
  });
});
