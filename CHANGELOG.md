# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.4] - 2026-01-20

### Added

- Comprehensive benchmark suite comparing bigtool-ts vs traditional all-tools-upfront approach
- 12 themed tool generators (AWS, Kubernetes, CI/CD, Monitoring, Security, Data, Support, Marketing, Finance, HR, E-commerce, Project Management)
- 356 generated tools for stress testing
- New scripts: `benchmark`, `benchmark:quick`, `benchmark:report`, `benchmark:generate`, `benchmark:generate:128`
- Benchmark documentation in `benchmarks/README.md`

### Results

- **82% context reduction** (2,721 → 500 tokens) at 128 tools
- **95% fewer tools loaded** (128 → 5.8 average)
- **Same accuracy** (83%) as baseline
- **Works beyond API limits**: OpenAI caps at 128 tools; bigtool-ts handles 356+ seamlessly

## [0.1.0] - 2026-01-19

### Added

- Initial release of bigtool-ts
- `ToolCatalog` for managing tool collections with semantic search
- `ToolLoader` for lazy-loading tools on demand
- Orama-powered semantic search with caching
- Tool sources:
  - `LocalToolSource` for statically defined tools
  - `MCPToolSource` for Model Context Protocol servers
  - `DynamicToolSource` for runtime-generated tools
  - `withMetadata` wrapper for enriching tool metadata
- LangGraph integration:
  - `createBigToolAgent` for building tool-discovery agents
  - Pre-built graph nodes for search and execution
- TypeScript-first with full type inference
- Comprehensive test coverage
