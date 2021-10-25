import { EntityManager, Connection, IDatabaseDriver } from "@mikro-orm/core";
import { Request, Response } from "express";
import { Redis } from "ioredis";
import { Session, SessionData } from "express-session";

export type ResolverContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & {
    session: Session &
      Partial<SessionData> & {
        userId: number;
      };
  };
  res: Response;
  redis: Redis;
};