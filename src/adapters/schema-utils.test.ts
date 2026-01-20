/**
 * Tests for schema conversion utilities.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { jsonSchemaToZod } from './schema-utils.js';

describe('jsonSchemaToZod', () => {
  describe('primitive types', () => {
    it('converts string schema', () => {
      const schema = jsonSchemaToZod({
        type: 'string',
        description: 'A name',
      });

      expect(schema.parse('hello')).toBe('hello');
      expect(() => schema.parse(123)).toThrow();
    });

    it('converts string with minLength/maxLength', () => {
      const schema = jsonSchemaToZod({
        type: 'string',
        minLength: 2,
        maxLength: 5,
      });

      expect(schema.parse('abc')).toBe('abc');
      expect(() => schema.parse('a')).toThrow();
      expect(() => schema.parse('toolong')).toThrow();
    });

    it('converts string with pattern', () => {
      const schema = jsonSchemaToZod({
        type: 'string',
        pattern: '^[a-z]+$',
      });

      expect(schema.parse('abc')).toBe('abc');
      expect(() => schema.parse('ABC')).toThrow();
    });

    it('converts number schema', () => {
      const schema = jsonSchemaToZod({
        type: 'number',
        description: 'A count',
      });

      expect(schema.parse(42)).toBe(42);
      expect(schema.parse(3.14)).toBe(3.14);
      expect(() => schema.parse('hello')).toThrow();
    });

    it('converts integer schema', () => {
      const schema = jsonSchemaToZod({
        type: 'integer',
        minimum: 0,
        maximum: 100,
      });

      expect(schema.parse(50)).toBe(50);
      expect(() => schema.parse(3.14)).toThrow();
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(101)).toThrow();
    });

    it('converts boolean schema', () => {
      const schema = jsonSchemaToZod({
        type: 'boolean',
      });

      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
      expect(() => schema.parse('true')).toThrow();
    });

    it('converts null schema', () => {
      const schema = jsonSchemaToZod({
        type: 'null',
      });

      expect(schema.parse(null)).toBe(null);
      expect(() => schema.parse(undefined)).toThrow();
    });
  });

  describe('enum types', () => {
    it('converts string enum', () => {
      const schema = jsonSchemaToZod({
        type: 'string',
        enum: ['a', 'b', 'c'],
      });

      expect(schema.parse('a')).toBe('a');
      expect(schema.parse('b')).toBe('b');
      expect(() => schema.parse('d')).toThrow();
    });

    it('converts single value enum', () => {
      const schema = jsonSchemaToZod({
        enum: ['only'],
      });

      expect(schema.parse('only')).toBe('only');
      expect(() => schema.parse('other')).toThrow();
    });

    it('converts number enum', () => {
      const schema = jsonSchemaToZod({
        enum: [1, 2, 3],
      });

      expect(schema.parse(1)).toBe(1);
      expect(schema.parse(2)).toBe(2);
      expect(() => schema.parse(4)).toThrow();
    });
  });

  describe('array types', () => {
    it('converts array of strings', () => {
      const schema = jsonSchemaToZod({
        type: 'array',
        items: { type: 'string' },
      });

      expect(schema.parse(['a', 'b'])).toEqual(['a', 'b']);
      expect(() => schema.parse([1, 2])).toThrow();
    });

    it('converts array without items', () => {
      const schema = jsonSchemaToZod({
        type: 'array',
      });

      expect(schema.parse([1, 'a', true])).toEqual([1, 'a', true]);
    });
  });

  describe('object types', () => {
    it('converts simple object', () => {
      const schema = jsonSchemaToZod({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
        required: ['name'],
      });

      expect(schema.parse({ name: 'John', age: 30 })).toEqual({
        name: 'John',
        age: 30,
      });
      expect(schema.parse({ name: 'John' })).toEqual({ name: 'John' });
      expect(() => schema.parse({ age: 30 })).toThrow();
    });

    it('converts nested object', () => {
      const schema = jsonSchemaToZod({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        required: ['user'],
      });

      expect(schema.parse({ user: { name: 'John' } })).toEqual({
        user: { name: 'John' },
      });
    });

    it('converts object without properties', () => {
      const schema = jsonSchemaToZod({
        type: 'object',
      });

      expect(schema.parse({ any: 'thing' })).toEqual({ any: 'thing' });
    });
  });

  describe('edge cases', () => {
    it('handles undefined schema', () => {
      const schema = jsonSchemaToZod(undefined);
      expect(schema.parse('anything')).toBe('anything');
      expect(schema.parse(123)).toBe(123);
    });

    it('handles empty object', () => {
      const schema = jsonSchemaToZod({});
      expect(schema.parse('anything')).toBe('anything');
    });

    it('handles unknown type', () => {
      const schema = jsonSchemaToZod({ type: 'unknown' });
      expect(schema.parse('anything')).toBe('anything');
    });

    it('preserves description', () => {
      const schema = jsonSchemaToZod({
        type: 'string',
        description: 'A test field',
      }) as z.ZodString;

      expect(schema.description).toBe('A test field');
    });
  });

  describe('real-world tool schemas', () => {
    it('converts create_pr tool schema', () => {
      const schema = jsonSchemaToZod({
        type: 'object',
        properties: {
          title: { type: 'string', description: 'PR title' },
          body: { type: 'string', description: 'PR description' },
          head: { type: 'string', description: 'Source branch' },
          base: { type: 'string', description: 'Target branch' },
          draft: { type: 'boolean', description: 'Create as draft' },
        },
        required: ['title', 'head', 'base'],
      });

      expect(
        schema.parse({
          title: 'Fix bug',
          head: 'feature/fix',
          base: 'main',
        })
      ).toEqual({
        title: 'Fix bug',
        head: 'feature/fix',
        base: 'main',
      });

      expect(
        schema.parse({
          title: 'Fix bug',
          body: 'Detailed description',
          head: 'feature/fix',
          base: 'main',
          draft: true,
        })
      ).toEqual({
        title: 'Fix bug',
        body: 'Detailed description',
        head: 'feature/fix',
        base: 'main',
        draft: true,
      });

      expect(() => schema.parse({ title: 'Fix bug' })).toThrow();
    });
  });
});
