import { MikroORM } from "@mikro-orm/core";
import { Post } from "./Entities/Post";

const { join } = require("path");
const { __db_user__, __db_password__, __prod__ } = require("./constants");

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
  entities: [Post],
} as Parameters<typeof MikroORM.init>[0];
