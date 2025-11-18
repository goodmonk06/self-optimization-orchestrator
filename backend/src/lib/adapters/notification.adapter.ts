/**
 * Notification Adapter Interface
 * Allows pluggable notification delivery across multiple channels
 */

export interface NotificationPayload {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface INotificationAdapter {
  /**
   * Send a notification through this channel
   */
  send(payload: NotificationPayload): Promise<NotificationResult>;

  /**
   * Validate configuration for this adapter
   */
  validateConfig(config: Record<string, any>): boolean;

  /**
   * Get adapter name
   */
  getName(): string;
}

/**
 * Webhook Notification Adapter
 */
export class WebhookNotificationAdapter implements INotificationAdapter {
  constructor(private config: { url: string; headers?: Record<string, string> }) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        messageId: response.headers.get('x-message-id') || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  validateConfig(config: Record<string, any>): boolean {
    return typeof config.url === 'string' && config.url.startsWith('http');
  }

  getName(): string {
    return 'webhook';
  }
}

/**
 * Console Notification Adapter (for development)
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const { title, message, severity, metadata } = payload;
    const timestamp = new Date().toISOString();

    console.log(`\n[$${severity.toUpperCase()}] ${timestamp}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    if (metadata) {
      console.log('Metadata:', JSON.stringify(metadata, null, 2));
    }
    console.log('');

    return {
      success: true,
      messageId: `console-${Date.now()}`,
    };
  }

  validateConfig(): boolean {
    return true;
  }

  getName(): string {
    return 'console';
  }
}

/**
 * No-op Notification Adapter (disabled notifications)
 */
export class NoOpNotificationAdapter implements INotificationAdapter {
  async send(): Promise<NotificationResult> {
    return { success: true };
  }

  validateConfig(): boolean {
    return true;
  }

  getName(): string {
    return 'noop';
  }
}
