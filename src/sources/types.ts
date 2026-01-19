/**
 * Source Types
 *
 * Re-exports types used by source implementations.
 */

export type { 
  ToolSource, 
  ToolMetadata, 
  ToolEnhancement,
  EnhancedTool,
} from "../types.js";

export { withMetadata } from "../types.js";

/**
 * Additional search metadata that can be attached to tools.
 * @deprecated Use ToolEnhancement instead
 */
export interface ToolSearchMetadata {
  categories?: string[];
  keywords?: string[];
}
