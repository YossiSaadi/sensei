import { describe, it, expect } from 'vitest';
import { SuiteLoader } from '../src/loader.js';

const VALID_SUITE_YAML = `
id: test-suite
name: Test Suite
version: "1.0.0"
agent:
  adapter: http
  endpoint: http://localhost:3000
scenarios:
  - id: basic
    name: Basic Scenario
    layer: execution
    input:
      prompt: "Say hello"
    kpis:
      - id: greeting
        name: Greeting Check
        weight: 1.0
        method: automated
        config:
          type: contains
          expected: hello
`;

const MINIMAL_SUITE_YAML = `
id: min
name: Minimal
version: "0.1.0"
agent:
  adapter: stdio
  command: echo
scenarios:
  - id: s1
    name: Scenario 1
    layer: reasoning
    input:
      prompt: Think about this
    kpis:
      - id: k1
        name: KPI 1
        weight: 0.5
        method: llm-judge
        config:
          rubric: "Score 1-10"
          max_score: 10
`;

describe('SuiteLoader', () => {
  const loader = new SuiteLoader();

  describe('loadString — valid YAML', () => {
    it('parses a valid suite definition', () => {
      const suite = loader.loadString(VALID_SUITE_YAML);
      expect(suite.id).toBe('test-suite');
      expect(suite.name).toBe('Test Suite');
      expect(suite.version).toBe('1.0.0');
      expect(suite.agent.adapter).toBe('http');
      expect(suite.scenarios).toHaveLength(1);
      expect(suite.scenarios[0].kpis[0].config.type).toBe('contains');
    });

    it('parses a minimal suite', () => {
      const suite = loader.loadString(MINIMAL_SUITE_YAML);
      expect(suite.id).toBe('min');
      expect(suite.scenarios[0].layer).toBe('reasoning');
      expect(suite.scenarios[0].kpis[0].method).toBe('llm-judge');
    });

    it('parses suite with all three layers', () => {
      const yaml = `
id: multi
name: Multi Layer
version: "1.0.0"
agent:
  adapter: http
  endpoint: http://localhost:3000
scenarios:
  - id: exec
    name: Exec
    layer: execution
    input:
      prompt: Do something
    kpis:
      - id: k1
        name: K1
        weight: 1
        method: automated
        config:
          type: contains
          expected: result
  - id: reason
    name: Reason
    layer: reasoning
    depends_on: exec
    input:
      prompt: Why?
    kpis:
      - id: k2
        name: K2
        weight: 1
        method: llm-judge
        config:
          rubric: "1-10"
  - id: improve
    name: Improve
    layer: self-improvement
    depends_on: exec
    input:
      prompt: Do better
      feedback: Try harder
    kpis:
      - id: k3
        name: K3
        weight: 1
        method: comparative-judge
        config:
          comparison_type: improvement
`;
      const suite = loader.loadString(yaml);
      expect(suite.scenarios).toHaveLength(3);
      expect(suite.scenarios[2].input.feedback).toBe('Try harder');
      expect(suite.scenarios[1].depends_on).toBe('exec');
    });
  });

  describe('loadString — invalid YAML', () => {
    it('rejects non-YAML content', () => {
      expect(() => loader.loadString('{{{')).toThrow('Invalid YAML');
    });

    it('rejects empty content', () => {
      expect(() => loader.loadString('')).toThrow('must be a YAML object');
    });

    it('rejects null YAML', () => {
      expect(() => loader.loadString('null')).toThrow('must be a YAML object');
    });

    it('rejects YAML missing required fields', () => {
      const yaml = `
id: incomplete
name: Incomplete
`;
      expect(() => loader.loadString(yaml)).toThrow('Invalid suite definition');
    });

    it('rejects invalid layer value', () => {
      const yaml = `
id: bad
name: Bad
version: "1.0.0"
agent:
  adapter: http
scenarios:
  - id: s1
    name: S1
    layer: invalid-layer
    input:
      prompt: test
    kpis:
      - id: k1
        name: K1
        weight: 1
        method: automated
        config: {}
`;
      expect(() => loader.loadString(yaml)).toThrow('Invalid suite definition');
    });

    it('rejects empty scenarios array', () => {
      const yaml = `
id: empty
name: Empty
version: "1.0.0"
agent:
  adapter: http
scenarios: []
`;
      expect(() => loader.loadString(yaml)).toThrow('Invalid suite definition');
    });

    it('rejects KPI weight > 1', () => {
      const yaml = `
id: bad-weight
name: Bad Weight
version: "1.0.0"
agent:
  adapter: http
scenarios:
  - id: s1
    name: S1
    layer: execution
    input:
      prompt: test
    kpis:
      - id: k1
        name: K1
        weight: 5.0
        method: automated
        config: {}
`;
      expect(() => loader.loadString(yaml)).toThrow('Invalid suite definition');
    });
  });

  describe('loadFile', () => {
    it('rejects non-existent file', async () => {
      await expect(loader.loadFile('/nonexistent/path.yaml')).rejects.toThrow('Failed to read suite file');
    });
  });
});
