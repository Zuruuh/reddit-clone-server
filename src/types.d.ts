import { EntityManager, Connection, IDatabaseDriver } from "@mikro-orm/core";
import { Request, Response, Express } from "express";

export type ResolverContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: Express.session };
  res: Response;
};
