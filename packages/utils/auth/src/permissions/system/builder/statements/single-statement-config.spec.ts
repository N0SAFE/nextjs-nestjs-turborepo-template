import { describe, it, expect } from 'vitest';
import { StatementConfig } from './single-statement-config';

describe('StatementConfig', () => {
  describe('Basic Operations', () => {
    it('should return all actions', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete'] as const);
      expect(config.all()).toEqual(['create', 'read', 'update', 'delete']);
    });

    it('should return empty array for none()', () => {
      const config = new StatementConfig(['create', 'read'] as const);
      expect(config.none()).toEqual([]);
    });

    it('should build actions (same as all)', () => {
      const config = new StatementConfig(['read', 'write'] as const);
      expect(config.build()).toEqual(['read', 'write']);
    });

    it('should convert to array', () => {
      const config = new StatementConfig(['create', 'read'] as const);
      expect(config.toArray()).toEqual(['create', 'read']);
    });
  });

  describe('Pick and Omit Operations', () => {
    it('should pick specific actions', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete'] as const);
      expect(config.pick(['read', 'update']).all()).toEqual(['read', 'update']);
    });

    it('should pick single action', () => {
      const config = new StatementConfig(['create', 'read', 'update'] as const);
      expect(config.pick(['read']).all()).toEqual(['read']);
    });

    it('should return empty when picking non-existent actions', () => {
      const config = new StatementConfig(['create', 'read'] as const);
      expect(config.pick(['update' as any]).all()).toEqual([]);
    });

    it('should omit specific actions', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete'] as const);
      expect(config.omit(['create', 'delete']).all()).toEqual(['read', 'update']);
    });

    it('should omit single action', () => {
      const config = new StatementConfig(['create', 'read', 'update'] as const);
      expect(config.omit(['read']).all()).toEqual(['create', 'update']);
    });

    it('should return all actions when omitting non-existent actions', () => {
      const config = new StatementConfig(['create', 'read'] as const);
      expect(config.omit(['update' as any]).all()).toEqual(['create', 'read']);
    });
  });

  describe('Checking Operations', () => {
    const config = new StatementConfig(['create', 'read', 'update', 'delete'] as const);

    it('should check if has specific action', () => {
      expect(config.has('read')).toBe(true);
      expect(config.has('write')).toBe(false);
    });

    it('should check if has all specified actions', () => {
      expect(config.hasAll(['read', 'update'])).toBe(true);
      expect(config.hasAll(['read', 'write'])).toBe(false);
      expect(config.hasAll([])).toBe(true);
    });

    it('should check if has any of specified actions', () => {
      expect(config.hasAny(['read', 'write'])).toBe(true);
      expect(config.hasAny(['write', 'share'])).toBe(false);
      expect(config.hasAny([])).toBe(false);
    });

    it('should check if includes action', () => {
      expect(config.includes('create')).toBe(true);
      expect(config.includes('share')).toBe(false);
    });
  });

  describe('Array-like Operations', () => {
    const config = new StatementConfig(['create', 'read', 'update', 'delete', 'share'] as const);

    it('should get first action', () => {
      expect(config.first()).toBe('create');
    });

    it('should get last action', () => {
      expect(config.last()).toBe('share');
    });

    it('should get action at index', () => {
      expect(config.at(0)).toBe('create');
      expect(config.at(2)).toBe('update');
      expect(config.at(10)).toBeUndefined();
    });

    it('should find index of action', () => {
      expect(config.indexOf('update')).toBe(2);
      expect(config.indexOf('notexist')).toBe(-1);
    });

    it('should get length', () => {
      expect(config.length).toBe(5);
    });

    it('should check if empty', () => {
      expect(config.isEmpty).toBe(false);
      expect(new StatementConfig([] as const).isEmpty).toBe(true);
    });
  });

  describe('Filter and Map Operations', () => {
    it('should filter actions by predicate', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete'] as const);
      const filtered = config.filter(a => a.startsWith('c') || a.startsWith('u'));
      expect(filtered).toEqual(['create', 'update']);
    });

    it('should map actions to new values', () => {
      const config = new StatementConfig(['create', 'read', 'update'] as const);
      const mapped = config.map(a => a.toUpperCase());
      expect(mapped).toEqual(['CREATE', 'READ', 'UPDATE']);
    });

    it('should check every action satisfies predicate', () => {
      const config = new StatementConfig(['create', 'read', 'update'] as const);
      expect(config.every(a => a.length > 3)).toBe(true);
      expect(config.every(a => a.startsWith('c'))).toBe(false);
    });

    it('should check some action satisfies predicate', () => {
      const config = new StatementConfig(['create', 'read', 'update'] as const);
      expect(config.some(a => a.startsWith('c'))).toBe(true);
      expect(config.some(a => a.startsWith('z'))).toBe(false);
    });

    it('should find first action matching predicate', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete'] as const);
      expect(config.find(a => a.includes('e'))).toBe('create');
      expect(config.find(a => a.startsWith('z'))).toBeUndefined();
    });

    it('should find index of first action matching predicate', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete'] as const);
      expect(config.findIndex(a => a === 'update')).toBe(2);
      expect(config.findIndex((a: string) => a === 'share')).toBe(-1);
    });
  });

  describe('Transformation Operations', () => {
    it('should add actions (immutable)', () => {
      const config = new StatementConfig(['create', 'read'] as const);
      const newConfig = config.add('update', 'delete');
      
      expect(config.all()).toEqual(['create', 'read']);
      expect(newConfig.all()).toEqual(['create', 'read', 'update', 'delete']);
    });

    it('should concat with another config', () => {
      const config1 = new StatementConfig(['create', 'read'] as const);
      const config2 = new StatementConfig(['update', 'delete'] as const);
      const combined = config1.concat(config2);
      
      expect(combined.all()).toEqual(['create', 'read', 'update', 'delete']);
    });

    it('should remove duplicates', () => {
      const config = new StatementConfig(['read', 'create', 'read', 'update', 'create'] as const);
      const unique = config.unique();
      
      expect(unique.all()).toEqual(['read', 'create', 'update']);
    });

    it('should slice actions', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete', 'share'] as const);
      
      expect(config.slice(1, 3).all()).toEqual(['read', 'update']);
      expect(config.slice(2).all()).toEqual(['update', 'delete', 'share']);
      expect(config.slice(0, 2).all()).toEqual(['create', 'read']);
    });

    it('should reverse actions', () => {
      const config = new StatementConfig(['create', 'read', 'update'] as const);
      const reversed = config.reverse();
      
      expect(reversed.all()).toEqual(['update', 'read', 'create']);
      expect(config.all()).toEqual(['create', 'read', 'update']); // Original unchanged
    });

    it('should sort actions', () => {
      const config = new StatementConfig(['update', 'create', 'read', 'delete'] as const);
      const sorted = config.sort();
      
      expect(sorted.all()).toEqual(['create', 'delete', 'read', 'update']);
    });

    it('should sort with custom comparator', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete'] as const);
      const sorted = config.sort((a, b) => b.localeCompare(a)); // Reverse alphabetical
      
      expect(sorted.all()).toEqual(['update', 'read', 'delete', 'create']);
    });
  });

  describe('Utility Operations', () => {
    it('should join actions into string', () => {
      const config = new StatementConfig(['create', 'read', 'update'] as const);
      
      expect(config.join(', ')).toBe('create, read, update');
      expect(config.join(' | ')).toBe('create | read | update');
      expect(config.join()).toBe('create,read,update');
    });
  });

  describe('Specialized Filters', () => {
    it('should return readOnly permissions', () => {
      const config1 = new StatementConfig(['create', 'read', 'update'] as const);
      expect(config1.readOnly()).toEqual(['read']);

      const config2 = new StatementConfig(['create', 'update', 'delete'] as const);
      expect(config2.readOnly()).toEqual([]);
    });

    it('should return writeOnly permissions', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete', 'share'] as const);
      expect(config.writeOnly()).toEqual(['create', 'update', 'delete']);
    });

    it('should return withoutRead permissions', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete'] as const);
      expect(config.withoutRead()).toEqual(['create', 'update', 'delete']);
    });

    it('should return crudOnly permissions', () => {
      const config = new StatementConfig(['create', 'read', 'update', 'delete', 'share', 'manage'] as const);
      expect(config.crudOnly()).toEqual(['create', 'read', 'update', 'delete']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty actions array', () => {
      const config = new StatementConfig([] as const);
      
      expect(config.all()).toEqual([]);
      expect(config.isEmpty).toBe(true);
      expect(config.length).toBe(0);
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      const firstResult = config.first();
      expect(firstResult).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      const lastResult = config.last();
      expect(lastResult).toBeUndefined();
      const readOnlyResult = config.readOnly();
      expect(readOnlyResult).toEqual([]);
      const writeOnlyResult = config.writeOnly();
      expect(writeOnlyResult).toEqual([]);
    });

    it('should handle single action', () => {
      const config = new StatementConfig(['read'] as const);
      
      expect(config.all()).toEqual(['read']);
      expect(config.length).toBe(1);
      expect(config.first()).toBe('read');
      expect(config.last()).toBe('read');
      expect(config.has('read')).toBe(true);
    });

    it('should handle immutability correctly', () => {
      const original = new StatementConfig(['create', 'read'] as const);
      const modified = original.add('update');
      
      expect(original.all()).toEqual(['create', 'read']);
      expect(modified.all()).toEqual(['create', 'read', 'update']);
    });
  });
});
