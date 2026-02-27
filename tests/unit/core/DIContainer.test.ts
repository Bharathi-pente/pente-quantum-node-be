/**
 * Unit Tests for DI Container
 */

import { DIContainer, ServiceLifetime } from '../../../src/core/DIContainer';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  afterEach(() => {
    container.clear();
  });

  describe('registerSingleton', () => {
    it('should register and resolve a singleton service', () => {
      const token = Symbol('TestService');
      let callCount = 0;

      container.registerSingleton(token, () => {
        callCount++;
        return { name: 'TestService' };
      });

      const instance1 = container.resolve(token);
      const instance2 = container.resolve(token);

      expect(instance1).toBe(instance2);
      expect(callCount).toBe(1);
      expect(instance1).toEqual({ name: 'TestService' });
    });
  });

  describe('registerTransient', () => {
    it('should create a new instance each time for transient services', () => {
      const token = Symbol('TransientService');
      let callCount = 0;

      container.registerTransient(token, () => {
        callCount++;
        return { id: Math.random() };
      });

      const instance1 = container.resolve(token);
      const instance2 = container.resolve(token);

      expect(instance1).not.toBe(instance2);
      expect(callCount).toBe(2);
    });
  });

  describe('registerScoped', () => {
    it('should reuse instance within the same scope', () => {
      const token = Symbol('ScopedService');
      let callCount = 0;

      container.registerScoped(token, () => {
        callCount++;
        return { id: Math.random() };
      });

      const instance1 = container.resolve(token);
      const instance2 = container.resolve(token);

      expect(instance1).toBe(instance2);
      expect(callCount).toBe(1);
    });

    it('should create new instance after clearing scope', () => {
      const token = Symbol('ScopedService');
      let callCount = 0;

      container.registerScoped(token, () => {
        callCount++;
        return { id: Math.random() };
      });

      const instance1 = container.resolve(token);
      container.clearScope();
      const instance2 = container.resolve(token);

      expect(instance1).not.toBe(instance2);
      expect(callCount).toBe(2);
    });
  });

  describe('createScope', () => {
    it('should create a child container with same registrations', () => {
      const token = Symbol('Service');
      container.registerSingleton(token, () => ({ name: 'Test' }));

      const childContainer = container.createScope();
      const instance = childContainer.resolve(token);

      expect(instance).toEqual({ name: 'Test' });
    });
  });

  describe('has', () => {
    it('should return true for registered services', () => {
      const token = Symbol('Service');
      container.registerSingleton(token, () => ({}));

      expect(container.has(token)).toBe(true);
    });

    it('should return false for unregistered services', () => {
      const token = Symbol('UnregisteredService');
      expect(container.has(token)).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove a service registration', () => {
      const token = Symbol('Service');
      container.registerSingleton(token, () => ({}));

      expect(container.has(token)).toBe(true);
      container.unregister(token);
      expect(container.has(token)).toBe(false);
    });
  });

  describe('resolve', () => {
    it('should throw error when resolving unregistered service', () => {
      const token = Symbol('UnregisteredService');

      expect(() => container.resolve(token)).toThrow('Service not registered');
    });
  });
});
