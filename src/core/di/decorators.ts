/**
 * Decorators for dependency injection and handler registration
 */

import 'reflect-metadata';
import { ServiceLifetime } from './Container';

// Store for handler metadata
const handlerRegistry: any[] = [];
const handlerMetadata = new Map<any, HandlerMetadata>();

export interface HandlerMetadata {
  commands: Map<string, CommandMetadata>;
  actions: Map<string, ActionMetadata>;
  events: Map<string, EventMetadata>;
}

export interface CommandMetadata {
  methodName: string;
  command: string;
}

export interface ActionMetadata {
  methodName: string;
  pattern: string | RegExp;
}

export interface EventMetadata {
  methodName: string;
  event: string;
  middleware?: any;
}

/**
 * Mark a class as injectable
 */
export function Injectable(lifetime: ServiceLifetime = 'singleton') {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata('di:injectable', true, constructor);
    Reflect.defineMetadata('di:lifetime', lifetime, constructor);
    return constructor;
  };
}

/**
 * Inject a specific dependency by token
 */
export function Inject(token: symbol | string) {
  return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingTokens = Reflect.getMetadata('di:dependencies', target) || [];
    existingTokens[parameterIndex] = token;
    Reflect.defineMetadata('di:dependencies', existingTokens, target);
  };
}

/**
 * Mark a class as a Telegram handler with its dependency tokens
 */
export function Handler(...dependencyTokens: (symbol | string)[]) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Mark as injectable by default
    Reflect.defineMetadata('di:injectable', true, constructor);
    Reflect.defineMetadata('di:lifetime', 'singleton', constructor);
    Reflect.defineMetadata('handler:isHandler', true, constructor);
    Reflect.defineMetadata('handler:dependencies', dependencyTokens, constructor);

    // Register this handler
    handlerRegistry.push(constructor);

    return constructor;
  };
}

/**
 * Get the dependency tokens for a handler
 */
export function getHandlerDependencies(handlerClass: any): (symbol | string)[] {
  return Reflect.getMetadata('handler:dependencies', handlerClass) || [];
}

/**
 * Mark a method as a command handler
 */
export function Command(command: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const constructor = target.constructor;

    if (!handlerMetadata.has(constructor)) {
      handlerMetadata.set(constructor, {
        commands: new Map(),
        actions: new Map(),
        events: new Map(),
      });
    }

    const metadata = handlerMetadata.get(constructor)!;
    metadata.commands.set(command, {
      methodName: propertyKey,
      command,
    });

    return descriptor;
  };
}

/**
 * Mark a method as an action (callback query) handler
 */
export function Action(pattern: string | RegExp) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const constructor = target.constructor;

    if (!handlerMetadata.has(constructor)) {
      handlerMetadata.set(constructor, {
        commands: new Map(),
        actions: new Map(),
        events: new Map(),
      });
    }

    const metadata = handlerMetadata.get(constructor)!;
    const patternKey = pattern instanceof RegExp ? pattern.source : pattern;
    metadata.actions.set(patternKey, {
      methodName: propertyKey,
      pattern,
    });

    return descriptor;
  };
}

/**
 * Mark a method as an event handler (e.g., 'message', 'location', etc.)
 */
export function On(event: string, middleware?: any) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const constructor = target.constructor;

    if (!handlerMetadata.has(constructor)) {
      handlerMetadata.set(constructor, {
        commands: new Map(),
        actions: new Map(),
        events: new Map(),
      });
    }

    const metadata = handlerMetadata.get(constructor)!;
    metadata.events.set(event, {
      methodName: propertyKey,
      event,
      middleware,
    });

    return descriptor;
  };
}

/**
 * Get all registered handler classes
 */
export function getRegisteredHandlers(): any[] {
  return handlerRegistry;
}

/**
 * Get metadata for a specific handler class
 */
export function getHandlerMetadata(handlerClass: any): HandlerMetadata | undefined {
  return handlerMetadata.get(handlerClass);
}
