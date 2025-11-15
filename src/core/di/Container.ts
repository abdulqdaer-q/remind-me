/**
 * Advanced Dependency Injection Container
 * Supports automatic dependency resolution, multiple lifetimes, and decorator-based injection
 */

export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

export interface ServiceRegistration<T = any> {
  token: symbol | string;
  factory: (container: Container) => T;
  lifetime: ServiceLifetime;
  instance?: T;
  dependencies?: (symbol | string)[];
}

export class Container {
  private services = new Map<symbol | string, ServiceRegistration>();
  private scopedInstances = new Map<symbol | string, any>();
  private isScoped = false;

  /**
   * Register a service with the container
   */
  register<T>(
    token: symbol | string,
    factory: (container: Container) => T,
    lifetime: ServiceLifetime = 'singleton',
    dependencies: (symbol | string)[] = []
  ): void {
    this.services.set(token, {
      token,
      factory,
      lifetime,
      dependencies,
    });
  }

  /**
   * Register a class with automatic dependency resolution
   */
  registerClass<T>(
    token: symbol | string,
    Class: new (...args: any[]) => T,
    lifetime: ServiceLifetime = 'singleton'
  ): void {
    const dependencies = Reflect.getMetadata('design:paramtypes', Class) || [];
    const dependencyTokens = Reflect.getMetadata('di:dependencies', Class) || [];

    this.register(
      token,
      (container) => {
        const resolvedDeps = dependencyTokens.map((depToken: symbol | string) =>
          container.resolve(depToken)
        );
        return new Class(...resolvedDeps);
      },
      lifetime,
      dependencyTokens
    );
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(token: symbol | string): T {
    const registration = this.services.get(token);

    if (!registration) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    // Singleton: Create once and reuse
    if (registration.lifetime === 'singleton') {
      if (!registration.instance) {
        registration.instance = registration.factory(this);
      }
      return registration.instance;
    }

    // Scoped: Create once per scope
    if (registration.lifetime === 'scoped') {
      if (this.isScoped) {
        if (!this.scopedInstances.has(token)) {
          this.scopedInstances.set(token, registration.factory(this));
        }
        return this.scopedInstances.get(token);
      } else {
        // If not in scope, behave like transient
        return registration.factory(this);
      }
    }

    // Transient: Create new instance every time
    return registration.factory(this);
  }

  /**
   * Create a scoped container (useful for request-scoped dependencies)
   */
  createScope(): Container {
    const scopedContainer = new Container();
    scopedContainer.services = this.services;
    scopedContainer.isScoped = true;
    return scopedContainer;
  }

  /**
   * Check if a service is registered
   */
  has(token: symbol | string): boolean {
    return this.services.has(token);
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredTokens(): (symbol | string)[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all scoped instances (call after request is handled)
   */
  clearScope(): void {
    this.scopedInstances.clear();
  }
}

// Global container instance
export const container = new Container();
