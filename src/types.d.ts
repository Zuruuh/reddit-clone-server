import { EntityManager, Connection, IDatabaseDriver } from "@mikro-orm/core";

export type ResolverContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
};
