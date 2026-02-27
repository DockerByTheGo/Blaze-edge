import type { IResultable, Optionable } from "@blazyts/better-standard-library";
import type { Service } from "@src/service-manager";
import type { Token } from "typescript";

export type TokenResult = {
  token: string;
  expiresAt: number;
};



export interface IAuthService extends Service{
  issueToken(userId: string): Promise<Optionable<TokenResult>>;
  verifyToken(token: string): Promise<IResultable<TokenResult, ["expired", "invalid"]>>;
}
