import type { AuthSession, AuthUser, AuthService } from "./AuthService";

export type AuthIdentity = {
  id: string;
} & Record<string, unknown>;

export type AuthProviderArgs = {
  req?: any;
  authorization?: string | null;
};

export type AuthVerificationResult<TIdentity extends AuthIdentity = AuthIdentity> = {
  identity: TIdentity;
  token?: string;
  raw?: unknown;
};

export type AuthProvider<TIdentity extends AuthIdentity = AuthIdentity> = {
  name: string;
  authenticate(args: AuthProviderArgs): AuthVerificationResult<TIdentity> | null;
};

export type LocalSessionProviderOptions<TUser extends AuthUser = AuthUser> = {
  name?: string;
  mapSession?: (session: AuthSession<TUser>) => AuthIdentity | null;
};

export function createLocalSessionProvider<TUser extends AuthUser = AuthUser>(
  service: AuthService<TUser>,
  options?: LocalSessionProviderOptions<TUser>,
): AuthProvider {
  const mapSession = options?.mapSession ?? ((session: AuthSession<TUser>): AuthIdentity | null => {
    const candidate = (session.user as Record<string, unknown>).id ??
      (session.user as Record<string, unknown>).userId ??
      (session.user as Record<string, unknown>).sub;

    if (candidate === undefined || candidate === null) {
      return null;
    }

    return {
      ...session.user,
      id: String(candidate),
    } as AuthIdentity;
  });

  return {
    name: options?.name ?? "local",
    authenticate({ authorization }) {
      const session = service.fromAuthorizationHeader(authorization ?? null);
      if (!session) {
        return null;
      }

      const identity = mapSession(session);
      if (!identity) {
        return null;
      }

      return {
        identity,
        token: session.token,
        raw: session,
      };
    },
  };
}
