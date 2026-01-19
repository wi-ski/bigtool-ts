# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
