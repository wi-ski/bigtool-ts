/**
 * search_tools Tool
 *
 * The dynamic tool that allows the LLM to discover relevant tools
 * by searching through the tool catalog.
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import type { SearchIndex, ToolCatalog } from "../types.js";
/**
 * Configuration for creating the search_tools tool
 */
export interface CreateSearchToolsToolConfig {
    /** The search index for finding tools */
    index: SearchIndex;
    /** The tool catalog for getting metadata */
    catalog: ToolCatalog;
    /** Maximum number of results to return */
    limit?: number;
}
/**
 * Creates the search_tools DynamicStructuredTool.
 *
 * This tool is always bound to the LLM and allows it to discover
 * relevant tools based on what it needs to accomplish.
 *
 * @param config - Configuration for the search tool
 * @returns A DynamicStructuredTool for searching tools
 */
export declare function createSearchToolsTool(config: CreateSearchToolsToolConfig): DynamicStructuredTool;
/**
 * Type of the search_tools tool
 */
export type SearchToolsTool = ReturnType<typeof createSearchToolsTool>;
//# sourceMappingURL=search-tool.d.ts.map