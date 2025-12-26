import { Config } from "../config/index.js";
import { UnrealHttpClient } from "./http-client.js";

/**
 * Connection manager for Unreal Engine
 *
 * Handles connection lifecycle, reconnection, and provides
 * access to HTTP and WebSocket clients.
 */
export class ConnectionManager {
  private config: Config;
  private httpClient: UnrealHttpClient | null = null;
  private connected = false;
  private lastConnectionAttempt: number = 0;
  private connectionCooldown = 5000; // 5 seconds between connection attempts

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Attempt to connect to Unreal Engine
   *
   * @throws Error if connection fails and not in mock mode
   */
  async connect(): Promise<void> {
    if (this.config.mockMode) {
      this.connected = true;
      console.error("[ConnectionManager] Running in mock mode");
      return;
    }

    this.httpClient = new UnrealHttpClient(this.config.httpUrl, this.config.timeout);

    // Test connection with a ping
    const success = await this.httpClient.ping();
    if (!success) {
      throw new Error(
        `Failed to connect to Unreal Engine at ${this.config.httpUrl}. ` +
          "Ensure the Remote Control API plugin is enabled and the editor is running."
      );
    }

    this.connected = true;
    console.error(`[ConnectionManager] Connected to ${this.config.httpUrl}`);
  }

  /**
   * Try to connect if not connected, with rate limiting
   */
  async ensureConnected(): Promise<boolean> {
    if (this.connected) return true;

    const now = Date.now();
    if (now - this.lastConnectionAttempt < this.connectionCooldown) {
      return false;
    }

    this.lastConnectionAttempt = now;

    try {
      await this.connect();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the HTTP client
   *
   * Creates a new client if not already created.
   * Note: The client may not be connected to a running UE instance.
   */
  getHttpClient(): UnrealHttpClient {
    if (!this.httpClient) {
      this.httpClient = new UnrealHttpClient(this.config.httpUrl, this.config.timeout);
    }
    return this.httpClient;
  }

  /**
   * Check if connected to Unreal Engine
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check if running in mock mode
   */
  isMockMode(): boolean {
    return this.config.mockMode;
  }

  /**
   * Get the current configuration
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * Disconnect from Unreal Engine
   */
  disconnect(): void {
    this.connected = false;
    this.httpClient = null;
    console.error("[ConnectionManager] Disconnected");
  }
}
