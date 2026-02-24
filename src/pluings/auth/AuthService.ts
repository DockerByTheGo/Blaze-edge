export type AuthUser = Record<string, unknown>;

export type AuthSession<TUser extends AuthUser = AuthUser> = {
  token: string;
  user: TUser;
  expiresAt?: number;
};

export class AuthService {
  private readonly sessions = new Map<string, AuthSession>();

  issueNewToken(userId: string): string {
    const token = this.generateToken();
    const session: AuthSession = { token, user: { id: userId } };
    this.sessions.set(token, session);
    return token;
  }

  getUserId(token: string): Optionable<string> {
    const session = this.verifyToken(token);
    return session ? session.user.id : null;
  }

  private generateToken(): string {
    // Implement token generation logic here
    return 'generated-token';
  }

  private verifyToken(token: string): AuthSession | null {
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
}
