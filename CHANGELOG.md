# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-16

### Added

- **Engine Core** (`@sensei/engine`)
  - Zod schema for runtime validation of YAML suite definitions
  - Suite loader with YAML parsing and descriptive error messages
  - Automated KPI scorer: `contains`, `regex`, `json-schema`, `numeric-range`
  - Weighted score aggregation: scenario, layer, and overall scores
  - Badge determination: gold (90+), silver (75+), bronze (60+)
  - Runner with layer-ordered execution, `depends_on` resolution, and retry logic
  - Reporter with JSON and ANSI terminal output formats
- **Monorepo scaffolding** with npm workspaces: `@sensei/engine`, `@sensei/cli`, `@sensei/sdk`
- **Unit tests** — 52 tests covering loader, scorer, reporter, and runner
- **CI/CD** — GitHub Actions workflows for CI (build + test) and npm publishing
- **Badge SVGs** — gold, silver, bronze badge images
- Architecture documentation and project specification
