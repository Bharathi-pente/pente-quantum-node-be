/**
 * Unit Tests for Pagination Utilities
 */

import {
  encodeCursor,
  decodeCursor,
  buildCursorWhere,
  buildPaginatedResponse,
} from '../../../src/utils/pagination';

describe('Pagination Utilities', () => {
  describe('encodeCursor', () => {
    it('should encode cursor fields to base64', () => {
      const cursor = encodeCursor('2024-01-01', '123');
      expect(cursor).toBeDefined();
      expect(typeof cursor).toBe('string');
    });

    it('should handle null values', () => {
      const cursor = encodeCursor(null, '123');
      expect(cursor).toBeDefined();
    });
  });

  describe('decodeCursor', () => {
    it('should decode base64 cursor back to fields', () => {
      const original = { value: '2024-01-01', id: '123' };
      const encoded = encodeCursor('2024-01-01', '123');
      const decoded = decodeCursor(encoded);

      expect(decoded).toEqual(original);
    });

    it('should handle invalid cursor gracefully', () => {
      expect(() => decodeCursor('invalid-cursor')).toThrow('Invalid cursor format');
    });
  });

  describe('buildCursorWhere', () => {
    it('should build WHERE clause for forward pagination', () => {
      const cursor = encodeCursor('2024-01-01', '100');
      const where = buildCursorWhere(cursor, 'created_at', 'asc');

      expect(where).toBeDefined();
      expect(where.OR).toBeInstanceOf(Array);
    });

    it('should return empty object when no cursor provided', () => {
      const where = buildCursorWhere(undefined, 'created_at', 'asc');
      expect(where).toEqual({});
    });

    it('should handle backward pagination', () => {
      const cursor = encodeCursor('2024-01-01', '100');
      const where = buildCursorWhere(cursor, 'created_at', 'desc');

      expect(where).toBeDefined();
      expect(where.OR).toBeInstanceOf(Array);
    });
  });

  describe('buildPaginatedResponse', () => {
    it('should build paginated response with next cursor', () => {
      const items = [
        { id: '1', name: 'Item 1', created_at: new Date('2024-01-01') },
        { id: '2', name: 'Item 2', created_at: new Date('2024-01-02') },
      ];

      const response = buildPaginatedResponse(items, 10, 'created_at');

      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('pageInfo');
      expect(response.data).toEqual(items);
      expect(response.pageInfo.hasNextPage).toBe(false);
    });

    it('should indicate hasNext when items exceed limit', () => {
      const items = Array.from({ length: 11 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Item ${i + 1}`,
        created_at: new Date(),
      }));

      const response = buildPaginatedResponse(items, 10, 'id');

      expect(response.data).toHaveLength(10);
      expect(response.pageInfo.hasNextPage).toBe(true);
      expect(response.pageInfo.endCursor).toBeDefined();
    });

    it('should handle empty results', () => {
      const response = buildPaginatedResponse([], 10, 'id');

      expect(response.data).toEqual([]);
      expect(response.pageInfo.hasNextPage).toBe(false);
      expect(response.pageInfo.endCursor).toBeNull();
    });
  });
});
