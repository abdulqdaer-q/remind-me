/**
 * Handler Registry
 * Automatically discovers and registers decorated handlers with Telegraf
 */

import { Telegraf } from 'telegraf';
import { Container } from '../di/Container';
import {
  getRegisteredHandlers,
  getHandlerMetadata,
  getHandlerDependencies,
} from '../di/decorators';

export class HandlerRegistry {
  constructor(
    private bot: Telegraf,
    private container: Container
  ) {}

  /**
   * Register all decorated handlers with the bot
   */
  registerAll(): void {
    const handlers = getRegisteredHandlers();

    console.log(`[HandlerRegistry] Found ${handlers.length} handler(s) to register`);

    for (const HandlerClass of handlers) {
      this.registerHandler(HandlerClass);
    }

    console.log('[HandlerRegistry] All handlers registered successfully');
  }

  /**
   * Register a single handler class
   */
  private registerHandler(HandlerClass: any): void {
    const metadata = getHandlerMetadata(HandlerClass);

    if (!metadata) {
      console.warn(`[HandlerRegistry] No metadata found for handler: ${HandlerClass.name}`);
      return;
    }

    // Create handler instance directly with dependencies from container
    const handler: any = this.createHandlerInstance(HandlerClass);

    // Register commands
    for (const [command, commandMeta] of metadata.commands) {
      console.log(`[HandlerRegistry] Registering command: /${command} -> ${HandlerClass.name}.${commandMeta.methodName}`);

      this.bot.command(command, async (ctx) => {
        try {
          await handler[commandMeta.methodName](ctx);
        } catch (error) {
          console.error(`[HandlerRegistry] Error in command /${command}:`, error);
          throw error;
        }
      });
    }

    // Register actions (callback queries)
    for (const [patternKey, actionMeta] of metadata.actions) {
      console.log(`[HandlerRegistry] Registering action: ${patternKey} -> ${HandlerClass.name}.${actionMeta.methodName}`);

      this.bot.action(actionMeta.pattern, async (ctx) => {
        try {
          await handler[actionMeta.methodName](ctx);
        } catch (error) {
          console.error(`[HandlerRegistry] Error in action ${patternKey}:`, error);
          throw error;
        }
      });
    }

    // Register event handlers
    for (const [event, eventMeta] of metadata.events) {
      console.log(`[HandlerRegistry] Registering event: ${event} -> ${HandlerClass.name}.${eventMeta.methodName}`);

      this.bot.on(event as any, async (ctx) => {
        try {
          await handler[eventMeta.methodName](ctx);
        } catch (error) {
          console.error(`[HandlerRegistry] Error in event ${event}:`, error);
          throw error;
        }
      });
    }
  }

  /**
   * Create a handler instance with dependencies resolved from the container
   */
  private createHandlerInstance(HandlerClass: any): any {
    const dependencyTokens = getHandlerDependencies(HandlerClass);

    if (dependencyTokens.length === 0) {
      console.warn(`[HandlerRegistry] No dependencies specified for ${HandlerClass.name}. Creating without DI.`);
      return new HandlerClass();
    }

    // Resolve all dependencies from the container
    const dependencies = dependencyTokens.map((token) => this.container.resolve(token));

    // Create the handler instance with resolved dependencies
    return new HandlerClass(...dependencies);
  }

  /**
   * Register a specific handler instance manually (if needed)
   */
  registerInstance(handlerToken: symbol | string, handler: any): void {
    const HandlerClass = handler.constructor;
    const metadata = getHandlerMetadata(HandlerClass);

    if (!metadata) {
      console.warn(`[HandlerRegistry] No metadata found for handler instance: ${HandlerClass.name}`);
      return;
    }

    // Register commands
    for (const [command, commandMeta] of metadata.commands) {
      this.bot.command(command, (ctx) => handler[commandMeta.methodName](ctx));
    }

    // Register actions
    for (const [, actionMeta] of metadata.actions) {
      this.bot.action(actionMeta.pattern, (ctx) => handler[actionMeta.methodName](ctx));
    }

    // Register events
    for (const [event, eventMeta] of metadata.events) {
      this.bot.on(event as any, (ctx) => handler[eventMeta.methodName](ctx));
    }
  }
}
