# Sensei

**Open-source AI agent qualification engine.**

Test, evaluate, and certify AI agents across professional skills with standardized benchmarks, real-world scenarios, and measurable KPIs.

> *"Before you hire an agent, ask the Sensei."*

## What is Sensei?

Sensei is an open-source framework for evaluating AI agents on real-world professional tasks. It provides:

- **Standardized test suites** for common agent roles (SDR, Support, QA, Content, Data Analysis, etc.)
- **Three-layer evaluation** — Task execution, Reasoning, Self-improvement
- **Professional-grade KPIs** — not toy benchmarks, but metrics that matter in production
- **Pluggable architecture** — bring your own agent, any framework, any model
- **Machine-readable results** — JSON reports, scores, badges, CI/CD integration

## Quick Start

```bash
# Install
npm install @sensei/engine

# Or use the CLI
npm install -g @sensei/cli
```

### Programmatic Usage

```typescript
import { SuiteLoader, Runner, Scorer, Reporter } from '@sensei/engine';

// Load a test suite
const loader = new SuiteLoader();
const suite = await loader.loadFile('./suites/sdr/suite.yaml');

// Run against your agent (provide an adapter)
const runner = new Runner(adapter, { retries: 2 });
const result = await runner.run(suite);

// Output results
const reporter = new Reporter();
console.log(reporter.toTerminal(result));   // Pretty terminal output
console.log(reporter.toJSON(result));       // Machine-readable JSON
```

### CLI Usage

```bash
# Run a full suite against your agent
sensei test --suite sdr --agent http://localhost:3000/agent

# Run a specific scenario
sensei test --suite sdr --scenario cold-email --agent ./my-agent.sh

# Validate a custom suite definition
sensei validate ./my-suite.yaml

# List available suites
sensei list
```

## Three-Layer Evaluation

### Layer 1: Task Execution (50%)
*"Can the agent do the job?"*

Feed the agent realistic scenarios with clear success criteria. Measure output quality, accuracy, completeness, and speed.

### Layer 2: Conversational Reasoning (30%)
*"Can the agent explain its decisions?"*

After task completion, the agent is questioned about its approach. Why did it choose this strategy? What tradeoffs did it consider?

### Layer 3: Self-Improvement (20%)
*"Can the agent learn from feedback?"*

Give the agent specific feedback. Re-run the test. Compare before/after. Agents that improve score higher.

## Scoring

```
Scenario Score = weighted average of KPI scores
Layer Score    = average of scenario scores in that layer
Overall Score  = execution × 0.50 + reasoning × 0.30 + self_improvement × 0.20
```

### Badge Levels

| Badge | Score | Meaning |
|-------|-------|---------|
| ![Gold](assets/badges/gold.svg) | 90+ | Exceptional, top-tier agent |
| ![Silver](assets/badges/silver.svg) | 75-89 | Solid professional performance |
| ![Bronze](assets/badges/bronze.svg) | 60-74 | Meets minimum qualification |

### KPI Scoring Methods

- **Automated** — deterministic checks: `contains`, `regex`, `json-schema`, `numeric-range`
- **LLM Judge** — an LLM evaluates output quality against a rubric
- **Comparative Judge** — compares before/after outputs for improvement

## Suite Definition (YAML)

```yaml
id: my-suite
name: My Test Suite
version: "1.0.0"
agent:
  adapter: http
  endpoint: http://localhost:3000
scenarios:
  - id: basic-task
    name: Basic Task
    layer: execution
    input:
      prompt: "Write a professional email"
    kpis:
      - id: quality
        name: Output Quality
        weight: 0.7
        method: llm-judge
        config:
          rubric: "Score 1-10 on clarity, tone, and completeness"
          max_score: 10
      - id: has-subject
        name: Has Subject Line
        weight: 0.3
        method: automated
        config:
          type: regex
          expected: "^Subject:"
```

## Packages

| Package | Description |
|---------|-------------|
| `@sensei/engine` | Core evaluation engine — loader, runner, scorer, reporter |
| `@sensei/cli` | Command-line interface |
| `@sensei/sdk` | SDK for building custom suites programmatically |

## Architecture

```
packages/
├── engine/src/
│   ├── types.ts       # Core type definitions
│   ├── schema.ts      # Zod validation schemas
│   ├── loader.ts      # YAML suite parser + validator
│   ├── runner.ts      # Scenario execution orchestrator
│   ├── scorer.ts      # KPI scoring + aggregation
│   └── reporter.ts    # JSON and terminal output
├── cli/               # CLI tool
└── sdk/               # Suite authoring SDK
```

## Adapters

Sensei communicates with agents through adapters:

```typescript
interface AgentAdapter {
  name: string;
  connect(): Promise<void>;
  healthCheck(): Promise<boolean>;
  send(input: AdapterInput): Promise<AdapterOutput>;
  disconnect(): Promise<void>;
}
```

Built-in adapters: **HTTP**, **Stdio** (more coming: OpenClaw, LangChain)

## Roadmap

- [x] Architecture & specification
- [x] Core engine (runner, scorer, loader, reporter)
- [x] Zod schema validation
- [x] Unit tests (52 tests)
- [x] CI/CD workflows
- [ ] CLI commands (test, list, validate, info)
- [ ] LLM Judge integration
- [ ] HTTP & Stdio adapters
- [ ] SDR test suite
- [ ] Additional test suites (Support, Content, QA, Data, Developer)
- [ ] HTML reporter
- [ ] Web dashboard
- [ ] Community suite marketplace

## Contributing

We welcome contributions! Whether it's new test suites, scoring improvements, or framework adapters — Sensei gets better when the community builds together.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT — use it, fork it, improve it.

---

*Built by [WorkDraft.ai](https://workdraft.ai) — The managed marketplace for AI agent labor.*
