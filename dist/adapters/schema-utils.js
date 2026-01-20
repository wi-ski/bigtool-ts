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
export function jsonSchemaToZod(schema) {
    if (!schema || typeof schema !== 'object') {
        return z.unknown();
    }
    const jsonSchema = schema;
    return convertSchema(jsonSchema);
}
/**
 * Internal recursive converter.
 */
function convertSchema(schema) {
    const type = schema.type;
    // Handle enum types
    if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
        const enumValues = schema.enum;
        if (enumValues.every((v) => typeof v === 'string')) {
            const stringValues = enumValues;
            if (stringValues.length >= 1) {
                const result = z.enum([stringValues[0], ...stringValues.slice(1)]);
                return schema.description ? result.describe(schema.description) : result;
            }
        }
        // Non-string enums: use union of literals
        if (enumValues.length >= 2) {
            const literals = enumValues.map((v) => z.literal(v));
            const result = z.union([literals[0], literals[1], ...literals.slice(2)]);
            return schema.description ? result.describe(schema.description) : result;
        }
        else if (enumValues.length === 1) {
            // Single value enum: just use literal
            const result = z.literal(enumValues[0]);
            return schema.description ? result.describe(schema.description) : result;
        }
    }
    switch (type) {
        case 'string':
            return convertString(schema);
        case 'number':
        case 'integer':
            return convertNumber(schema);
        case 'boolean': {
            const result = z.boolean();
            return schema.description ? result.describe(schema.description) : result;
        }
        case 'array':
            return convertArray(schema);
        case 'object':
            return convertObject(schema);
        case 'null': {
            const result = z.null();
            return schema.description ? result.describe(schema.description) : result;
        }
        default:
            // Unknown or missing type: accept anything
            return z.unknown();
    }
}
/**
 * Convert string schema.
 */
function convertString(schema) {
    let result = z.string();
    if (schema.minLength !== undefined) {
        result = result.min(schema.minLength);
    }
    if (schema.maxLength !== undefined) {
        result = result.max(schema.maxLength);
    }
    if (schema.pattern !== undefined) {
        result = result.regex(new RegExp(schema.pattern));
    }
    return schema.description ? result.describe(schema.description) : result;
}
/**
 * Convert number schema.
 */
function convertNumber(schema) {
    let result = z.number();
    if (schema.type === 'integer') {
        result = result.int();
    }
    if (schema.minimum !== undefined) {
        result = result.min(schema.minimum);
    }
    if (schema.maximum !== undefined) {
        result = result.max(schema.maximum);
    }
    return schema.description ? result.describe(schema.description) : result;
}
/**
 * Convert array schema.
 */
function convertArray(schema) {
    const itemSchema = schema.items ? convertSchema(schema.items) : z.unknown();
    const result = z.array(itemSchema);
    return schema.description ? result.describe(schema.description) : result;
}
/**
 * Convert object schema.
 */
function convertObject(schema) {
    const properties = schema.properties;
    const required = new Set(schema.required ?? []);
    if (!properties || Object.keys(properties).length === 0) {
        // No properties defined: accept any object
        const result = z.record(z.unknown());
        return schema.description ? result.describe(schema.description) : result;
    }
    const shape = {};
    for (const [key, propSchema] of Object.entries(properties)) {
        let zodProp = convertSchema(propSchema);
        // Make optional if not in required array
        if (!required.has(key)) {
            zodProp = zodProp.optional();
        }
        shape[key] = zodProp;
    }
    const result = z.object(shape);
    return schema.description ? result.describe(schema.description) : result;
}
//# sourceMappingURL=schema-utils.js.map