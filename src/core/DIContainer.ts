/**
 * Dependency Injection Container
 * 
 * A simple, lightweight DI container for managing service dependencies
 * and improving testability.
 */

type ServiceIdentifier<T = any> = string | symbol | { new (...args: any[]): T };
type Factory<T> = () => T;

export enum ServiceLifetime {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient',
  SCOPED = 'scoped'
}

interface ServiceDescriptor<T = any> {
  identifier: ServiceIdentifier<T>;
  factory: Factory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
}

export class DIContainer {
  private services = new Map<ServiceIdentifier, ServiceDescriptor>();
  private scopedInstances = new Map<ServiceIdentifier, any>();

  /**
   * Register a service with the container
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    lifetime: ServiceLifetime = ServiceLifetime.SINGLETON
  ): void {
    this.services.set(identifier, {
      identifier,
      factory,
      lifetime
    });
  }

  /**
   * Register a singleton service (created once and reused)
   */
  registerSingleton<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>): void {
    this.register(identifier, factory, ServiceLifetime.SINGLETON);
  }

  /**
   * Register a transient service (created every time it's requested)
   */
  registerTransient<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>): void {
    this.register(identifier, factory, ServiceLifetime.TRANSIENT);
  }

  /**
   * Register a scoped service (created once per scope - useful for request-scoped services)
   */
  registerScoped<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>): void {
    this.register(identifier, factory, ServiceLifetime.SCOPED);
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    const descriptor = this.services.get(identifier);

    if (!descriptor) {
      throw new Error(`Service not registered: ${String(identifier)}`);
    }

    switch (descriptor.lifetime) {
      case ServiceLifetime.SINGLETON:
        if (!descriptor.instance) {
          descriptor.instance = descriptor.factory();
        }
        return descriptor.instance as T;

      case ServiceLifetime.SCOPED:
        if (!this.scopedInstances.has(identifier)) {
          this.scopedInstances.set(identifier, descriptor.factory());
        }
        return this.scopedInstances.get(identifier) as T;

      case ServiceLifetime.TRANSIENT:
        return descriptor.factory() as T;

      default:
        throw new Error(`Unknown service lifetime: ${descriptor.lifetime}`);
    }
  }

  /**
   * Clear scoped instances (call at the end of a request)
   */
  clearScope(): void {
    this.scopedInstances.clear();
  }

  /**
   * Create a child container for scoped services
   */
  createScope(): DIContainer {
    const scopedContainer = new DIContainer();
    
    // Copy service registrations to the scoped container
    this.services.forEach((descriptor, identifier) => {
      scopedContainer.services.set(identifier, { ...descriptor });
    });

    return scopedContainer;
  }

  /**
   * Check if a service is registered
   */
  has(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier);
  }

  /**
   * Remove a service registration
   */
  unregister(identifier: ServiceIdentifier): void {
    this.services.delete(identifier);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear();
    this.scopedInstances.clear();
  }
}

// Export a global container instance
export const container = new DIContainer();

// Service identifiers (tokens)
export const TYPES = {
  // Repositories
  CustomerRepository: Symbol.for('CustomerRepository'),
  OrganizationRepository: Symbol.for('OrganizationRepository'),
  ProductRepository: Symbol.for('ProductRepository'),
  InvoiceRepository: Symbol.for('InvoiceRepository'),
  
  // Services
  CustomerService: Symbol.for('CustomerService'),
  OrganizationService: Symbol.for('OrganizationService'),
  ProductService: Symbol.for('ProductService'),
  InvoiceService: Symbol.for('InvoiceService'),
  AuthService: Symbol.for('AuthService'),
  ContractService: Symbol.for('ContractService'),
  CreditService: Symbol.for('CreditService'),
  CurrencyService: Symbol.for('CurrencyService'),
  FeatureService: Symbol.for('FeatureService'),
  MeterService: Symbol.for('MeterService'),
  PaymentService: Symbol.for('PaymentService'),
  PricingModelService: Symbol.for('PricingModelService'),
  RateLimitService: Symbol.for('RateLimitService'),
  TaxService: Symbol.for('TaxService'),
  TaxExemptionService: Symbol.for('TaxExemptionService'),
  TaxRegionService: Symbol.for('TaxRegionService'),
  UsageLimitService: Symbol.for('UsageLimitService'),
  UserService: Symbol.for('UserService'),
  
  // Infrastructure
  Database: Symbol.for('Database'),
  Redis: Symbol.for('Redis'),
  Logger: Symbol.for('Logger'),
  CacheService: Symbol.for('CacheService'),
  
  // Background Jobs
  JobQueue: Symbol.for('JobQueue'),
  InvoiceJobProcessor: Symbol.for('InvoiceJobProcessor'),
  ReportJobProcessor: Symbol.for('ReportJobProcessor'),
};
