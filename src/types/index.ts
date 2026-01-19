/**
 * bigtool-ts Type Definitions
 *
 * Re-exports all types from the main types.ts file.
 */

// Re-export everything from the root types module
export {
  // Event types
  type EventHandler,
  type Unsubscribe,
  type EventEmitter,
  createEventEmitter,

  // Tool metadata
  type ToolMetadata,

  // Tool source
  type ToolSource,

  // Catalog
  type ToolsChangedEvent,
  type ToolCatalog,

  // Loader
  type ToolLoader,

  // Search
  type SearchOptions,
  type SearchResult,
  type SearchIndex,

  // Enhancements
  type ToolEnhancement,
  type EnhancedTool,
  withMetadata,
} from "../types.js";
