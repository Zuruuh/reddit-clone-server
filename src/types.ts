import { Request, Response } from "express";
import { Redis } from "ioredis";
import { Session, SessionData } from "express-session";

export type ResolverContext = {
  req: Request & {
    session: Session &
      Partial<SessionData> & {
        userId: number;
      };
  };
  res: Response;
  redis: Redis;
};
