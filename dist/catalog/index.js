/**
 * ToolCatalog module.
 *
 * Provides the default implementation of the ToolCatalog interface,
 * aggregating tools from multiple sources into a unified registry.
 *
 * @module catalog
 */
import { createEventEmitter } from '../types.js';
/**
 * Default implementation of ToolCatalog.
 *
 * Maintains a registry of tools from multiple sources and provides
 * a unified view of all available tool metadata. The catalog is the
 * central source of truth for what tools exist in the system.
 *
 * Key responsibilities:
 * - Registering and unregistering tool sources
 * - Aggregating metadata from all sources
 * - Emitting change events when tools are added or removed
 * - Providing source references for tool loading
 *
 * @example Basic usage
 * ```typescript
 * import { DefaultToolCatalog, LocalSource, MCPSource } from '@repo/bigtool-ts';
 *
 * const catalog = new DefaultToolCatalog();
 *
 * // Register sources
 * await catalog.register(new LocalSource(myTools));
 * await catalog.register(new MCPSource(mcpClient));
 *
 * // Query the catalog
 * const allTools = catalog.getAllMetadata();
 * console.log(`Total tools: ${allTools.length}`);
 *
 * // Get specific tool metadata
 * const tool = catalog.getMetadata('local:calculator');
 * ```
 *
 * @example Listening for changes
 * ```typescript
 * const catalog = new DefaultToolCatalog();
 *
 * catalog.onToolsChanged.subscribe(async (event) => {
 *   if (event.added.length > 0) {
 *     console.log('New tools:', event.added);
 *     await searchIndex.reindex();
 *   }
 *   if (event.removed.length > 0) {
 *     console.log('Removed tools:', event.removed);
 *   }
 * });
 *
 * await catalog.register(new LocalSource(tools));
 * ```
 */
export class DefaultToolCatalog {
    /** @internal Map of source ID to source */
    sources = new Map();
    /** @internal Map of source ID to its metadata */
    metadataBySource = new Map();
    /** @internal Map of tool ID to metadata for fast lookup */
    metadataById = new Map();
    /**
     * Event emitter for tool changes.
     *
     * Subscribe to be notified when tools are added or removed
     * from the catalog.
     */
    onToolsChanged;
    /**
     * Creates a new DefaultToolCatalog.
     *
     * The catalog starts empty. Call register() to add tool sources.
     *
     * @example
     * ```typescript
     * const catalog = new DefaultToolCatalog();
     * ```
     */
    constructor() {
        this.onToolsChanged = createEventEmitter();
    }
    /**
     * Register a new tool source.
     *
     * Fetches metadata from the source and adds all tools to the catalog.
     * Subscribes to the source's onRefresh event if available.
     * Emits a ToolsChangedEvent with the added tool IDs.
     *
     * @param source - The tool source to register
     * @throws Error if a source with the same ID is already registered
     *
     * @example
     * ```typescript
     * await catalog.register(new LocalSource(tools, 'my-tools'));
     * ```
     */
    async register(source) {
        if (this.sources.has(source.id)) {
            throw new Error(`ToolCatalog: Source with id '${source.id}' already registered`);
        }
        this.sources.set(source.id, source);
        // Fetch and store metadata
        const metadata = await source.getMetadata();
        this.metadataBySource.set(source.id, metadata);
        const added = [];
        for (const tool of metadata) {
            this.metadataById.set(tool.id, tool);
            added.push(tool.id);
        }
        // Subscribe to refresh events if available
        if (source.onRefresh) {
            source.onRefresh.on((newMetadata) => {
                this.handleSourceRefresh(source.id, newMetadata);
            });
        }
        // Emit change event
        this.onToolsChanged.emit({ added, removed: [] });
    }
    /**
     * Unregister a tool source by ID.
     *
     * Removes all tools from that source and emits a ToolsChangedEvent.
     * No-op if the source ID doesn't exist.
     *
     * @param sourceId - The source ID to unregister
     *
     * @example
     * ```typescript
     * // Remove a source
     * catalog.unregister('mcp:github');
     *
     * // Safe to call even if not registered
     * catalog.unregister('nonexistent'); // No-op
     * ```
     */
    unregister(sourceId) {
        const metadata = this.metadataBySource.get(sourceId);
        if (!metadata) {
            return;
        }
        const removed = [];
        for (const tool of metadata) {
            this.metadataById.delete(tool.id);
            removed.push(tool.id);
        }
        this.sources.delete(sourceId);
        this.metadataBySource.delete(sourceId);
        // Emit change event
        this.onToolsChanged.emit({ added: [], removed });
    }
    /**
     * Get all tool metadata in the catalog.
     *
     * Returns a snapshot of all currently registered tools from
     * all sources.
     *
     * @returns Array of all tool metadata
     *
     * @example
     * ```typescript
     * const allTools = catalog.getAllMetadata();
     * console.log(`Catalog has ${allTools.length} tools`);
     *
     * // Use for search indexing
     * await searchIndex.index(allTools);
     * ```
     */
    getAllMetadata() {
        return Array.from(this.metadataById.values());
    }
    /**
     * Get metadata for a specific tool.
     *
     * @param id - The tool ID to look up
     * @returns Tool metadata, or null if not found
     *
     * @example
     * ```typescript
     * const meta = catalog.getMetadata('local:calculator');
     * if (meta) {
     *   console.log(`Found: ${meta.name} - ${meta.description}`);
     * }
     * ```
     */
    getMetadata(id) {
        return this.metadataById.get(id) ?? null;
    }
    /**
     * Get the source for a tool by source ID.
     *
     * Used by the ToolLoader to retrieve tool implementations.
     *
     * @param sourceId - The source ID to look up
     * @returns The tool source, or null if not found
     *
     * @example
     * ```typescript
     * const source = catalog.getSource('mcp:github');
     * if (source) {
     *   const tool = await source.getTool('create_pr');
     * }
     * ```
     */
    getSource(sourceId) {
        return this.sources.get(sourceId) ?? null;
    }
    /**
     * Handle a source refresh event.
     *
     * @internal
     * @param sourceId - The source that refreshed
     * @param newMetadata - The new metadata from the source
     */
    handleSourceRefresh(sourceId, newMetadata) {
        const oldMetadata = this.metadataBySource.get(sourceId) ?? [];
        const oldIds = new Set(oldMetadata.map(m => m.id));
        const newIds = new Set(newMetadata.map(m => m.id));
        const added = [];
        const removed = [];
        // Find removed tools
        for (const id of oldIds) {
            if (!newIds.has(id)) {
                this.metadataById.delete(id);
                removed.push(id);
            }
        }
        // Find added/updated tools
        for (const tool of newMetadata) {
            if (!oldIds.has(tool.id)) {
                added.push(tool.id);
            }
            this.metadataById.set(tool.id, tool);
        }
        this.metadataBySource.set(sourceId, newMetadata);
        // Emit change event if anything changed
        if (added.length > 0 || removed.length > 0) {
            this.onToolsChanged.emit({ added, removed });
        }
    }
}
//# sourceMappingURL=index.js.map