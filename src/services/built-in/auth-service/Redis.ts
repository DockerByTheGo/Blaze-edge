import { randomUUID } from "crypto";
import type { IAuthService, TokenResult, VerificationResult } from "./IAuthService";

/**
 * Generic JWT-based authentication service
 * Stores users in memory with simple token validation
 */
export class RedisAuthService implements IAuthService {
  private users: Map<string, { password: string }> = new Map();
  private tokens: Map<string, { userId: string; expiresAt: number }> = new Map();

  constructor(public readonly config: {
    tokenExpirationTime?: number; // in milliseconds
    username: string;
    password: string;
    createIfNotExists?: boolean;
  }) {
    this.config.tokenExpirationTime = config.tokenExpirationTime ?? 3600000; // 1 hour default
    
    if (config.createIfNotExists !== false) {
      this.users.set(config.username, { password: config.password });
    }
  }

  async issueToken(userId: string): Promise<TokenResult | null> {
    if (!this.users.has(userId)) {
      return null;
    }

    const token = randomUUID();
    const expiresAt = Date.now() + (this.config.tokenExpirationTime || 3600000);
    this.tokens.set(token, { userId, expiresAt });

    return { token, expiresAt };
  }

  async verifyToken(token: string): Promise<VerificationResult> {
    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      return { success: false, error: "Token not found" };
    }

    if (tokenData.expiresAt < Date.now()) {
      this.tokens.delete(token);
      return { success: false, error: "Token expired" };
    }

    return { success: true, userId: tokenData.userId };
  }

  async authenticate(credentials: Record<string, string>): Promise<VerificationResult> {
    const { username, password } = credentials;

    if (!username || !password) {
      return { success: false, error: "Missing username or password" };
    }

    const user = this.users.get(username);
    if (!user || user.password !== password) {
      return { success: false, error: "Invalid credentials" };
    }

    const tokenResult = await this.issueToken(username);
    if (!tokenResult) {
      return { success: false, error: "Failed to issue token" };
    }

    return { success: true, userId: username };
  }

  /**
   * Register a new user
   */
  registerUser(username: string, password: string): boolean {
    if (this.users.has(username)) {
      return false;
    }
    this.users.set(username, { password });
    return true;
  }
}