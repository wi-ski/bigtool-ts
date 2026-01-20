/**
 * Schema conversion utilities for adapters.
 *
 * Provides utilities for converting between JSON Schema and Zod schemas.
 * Used by adapters that require Zod schemas (Inngest, Mastra) but receive
 * JSON Schema from tool metadata.
 *
 * @module adapters/schema-utils
 */
import { z } from 'zod';
/**
 * Convert a JSON Schema to a Zod schema.
 *
 * This is a simplified converter that handles common JSON Schema patterns
 * used in tool definitions. For complex schemas with advanced features
 * (allOf, oneOf, $ref), consider using a dedicated library.
 *
 * Supported types:
 * - string (with minLength, maxLength, pattern, enum)
 * - number/integer (with minimum, maximum)
 * - boolean
 * - array (with items)
 * - object (with properties, required)
 *
 * @param schema - JSON Schema object
 * @returns Zod schema equivalent
 *
 * @example
 * ```typescript
 * const jsonSchema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string', description: 'User name' },
 *     age: { type: 'integer', minimum: 0 },
 *   },
 *   required: ['name'],
 * };
 *
 * const zodSchema = jsonSchemaToZod(jsonSchema);
 * // Equivalent to: z.object({ name: z.string(), age: z.number().optional() })
 * ```
 */
export declare function jsonSchemaToZod(schema: Record<string, unknown> | undefined): z.ZodTypeAny;
//# sourceMappingURL=schema-utils.d.ts.map