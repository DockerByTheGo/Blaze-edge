import type { IAuthService, TokenResult } from "./IAuthService";
import type { IResultable } from "@blazyts/better-standard-library";

export type ClerkAuthConfig = {
  publishableKey: string;
  secretKey: string;
  tokenExpirationTime?: number;
};

/**
 * Clerk authentication service
 * Integrates with Clerk's authentication platform for user management and session handling
 */
export class ClerkAuthService implements IAuthService {
  private sessions: Map<string, { userId: string; expiresAt: number }> = new Map();

  constructor(public readonly config: ClerkAuthConfig) {
    this.config.tokenExpirationTime = config.tokenExpirationTime ?? 3600000; // 1 hour default
  }

  async issueToken(userId: string): Promise<TokenResult | null> {
    // In a real implementation, this would create a Clerk session
    const token = `clerk_${userId}_${Date.now()}`;
    const expiresAt = Date.now() + (this.config.tokenExpirationTime || 3600000);
    this.sessions.set(token, { userId, expiresAt });

    return { token, expiresAt };
  }

  async verifyToken(token: string): Promise<IResultable<TokenResult, ["expired", "invalid"]>> {
    const sessionData = this.sessions.get(token);

    if (!sessionData) {
      return {
        isOk: false,
        error: "invalid" as const,
      };
    }

    if (sessionData.expiresAt < Date.now()) {
      this.sessions.delete(token);
      return {
        isOk: false,
        error: "expired" as const,
      };
    }

    return {
      isOk: true,
      value: {
        token,
        expiresAt: sessionData.expiresAt,
      },
    };
  }

  /**
   * Authenticates a user via Clerk
   * In a real implementation, this would verify with Clerk's API
   */
  async authenticateWithClerk(clerkUserId: string): Promise<TokenResult | null> {
    return this.issueToken(clerkUserId);
  }

  /**
   * Invalidates a session
   */
  async revokeSession(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }
}
