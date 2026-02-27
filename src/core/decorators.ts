/**
 * Dependency Injection Decorators
 * 
 * TypeScript decorators for dependency injection
 */

import 'reflect-metadata';

// Metadata keys
const INJECTABLE_METADATA_KEY = Symbol('INJECTABLE_KEY');
const INJECT_METADATA_KEY = Symbol('INJECT_KEY');

/**
 * Marks a class as injectable
 */
export function Injectable(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target);
    return target;
  };
}

/**
 * Marks a parameter for dependency injection
 */
export function Inject(token: symbol | string): ParameterDecorator {
  return (target: Object, _propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingInjectedParams: any[] =
      Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
    
    existingInjectedParams.push({ index: parameterIndex, token });
    
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjectedParams, target);
  };
}

/**
 * Check if a class is marked as injectable
 */
export function isInjectable(target: any): boolean {
  return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target) === true;
}

/**
 * Get injection tokens for a class
 */
export function getInjectionTokens(target: any): any[] {
  return Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
}
