/**
 * Domain Event System
 * Typed events for cross-service communication and extensibility
 */

export type DomainEventType =
  | 'repo.created'
  | 'repo.updated'
  | 'repo.deleted'
  | 'repo.discovered'
  | 'analysis.started'
  | 'analysis.completed'
  | 'analysis.failed'
  | 'action.created'
  | 'action.completed'
  | 'schedule.created'
  | 'schedule.triggered'
  | 'notification.sent'
  | 'health.degraded'
  | 'tag.added'
  | 'tag.removed';

export interface DomainEvent<T = any> {
  type: DomainEventType;
  entityType: string;
  entityId: string;
  data: T;
  timestamp: Date;
  correlationId?: string;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

/**
 * Simple in-process event bus
 * In production, this could be replaced with Redis pub/sub, RabbitMQ, etc.
 */
export class EventBus {
  private handlers: Map<DomainEventType, EventHandler[]> = new Map();

  /**
   * Subscribe to an event type
   */
  on<T = any>(eventType: DomainEventType, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Unsubscribe from an event type
   */
  off(eventType: DomainEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  async emit<T = any>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    // Execute all handlers (could be made parallel with Promise.all)
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
        // Don't throw - let other handlers run
      }
    }
  }

  /**
   * Create and emit an event
   */
  async publish<T = any>(
    type: DomainEventType,
    entityType: string,
    entityId: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    const event: DomainEvent<T> = {
      type,
      entityType,
      entityId,
      data,
      timestamp: new Date(),
      correlationId,
    };

    await this.emit(event);
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): DomainEventType[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Global event bus instance
export const eventBus = new EventBus();
