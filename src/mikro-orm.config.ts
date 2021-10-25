import { MikroORM } from "@mikro-orm/core";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

import { join } from "path";
import { __db_user__, __db_password__, __prod__ } from "./constants";

const dbConfig = {
  type: "postgresql",
  dbName: "reddit-clone",
  debug: !__prod__,
  user: __db_user__,
  password: __db_password__,
};

export default {
  ...dbConfig,
  migrations: {
    path: join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post, User],
} as Parameters<typeof MikroORM.init>[0];
