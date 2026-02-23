export type AuthUser = Record<string, unknown>;

export type AuthSession<TUser extends AuthUser = AuthUser> = {
  token: string;
  user: TUser;
  expiresAt?: number;
};

export class AuthService<TUser extends AuthUser = AuthUser> {
  private readonly sessions = new Map<string, AuthSession<TUser>>();

  createSession(token: string, user: TUser, options?: { ttlMs?: number }): AuthSession<TUser> {
    const expiresAt = typeof options?.ttlMs === "number"
      ? Date.now() + options.ttlMs
      : undefined;

    const session: AuthSession<TUser> = {
      token,
      user,
      expiresAt,
    };

    this.sessions.set(token, session);
    return session;
  }

  setSession(session: AuthSession<TUser>): AuthSession<TUser> {
    this.sessions.set(session.token, session);
    return session;
  }

  verifyToken(token: string): AuthSession<TUser> | null {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    if (typeof session.expiresAt === "number" && session.expiresAt <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  fromAuthorizationHeader(header?: string | null): AuthSession<TUser> | null {
    if (!header) {
      return null;
    }

    const [scheme, token] = header.trim().split(/\s+/, 2);
    if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
      return null;
    }

    return this.verifyToken(token);
  }

  revoke(token: string): boolean {
    return this.sessions.delete(token);
  }

  clear(): void {
    this.sessions.clear();
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}
