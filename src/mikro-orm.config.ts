import { MikroORM } from "@mikro-orm/core";
import { join } from "path";
import { __prod__ } from "./constants";
import { Post } from "./Entities/Post";

export default {
  type: "postgresql",
  dbName: "reddit-clone",
  debug: !__prod__,
  user: "root",
  password: "root",
  migrations: {
    path: join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post],
} as Parameters<typeof MikroORM.init>[0];
