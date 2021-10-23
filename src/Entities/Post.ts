import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Post {
  @PrimaryKey()
  id!: number;

  @Property({ type: "text" })
  title!: string;

  @Property({ type: "date" })
  createdAt = new Date();

  @Property({ type: "text", onUpdate: () => new Date() })
  updatedAt = new Date();
}
