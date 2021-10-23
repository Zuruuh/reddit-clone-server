import { User } from "../Entities/User";
import {
  Resolver,
  InputType,
  Field,
  Mutation,
  Arg,
  Ctx,
  ObjectType,
  Query,
} from "type-graphql";
import { hash, verify } from "argon2";
import type { ResolverContext } from "../types";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  // ! My Profile
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: ResolverContext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  // ! Register
  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em, req }: ResolverContext
  ): Promise<UserResponse> {
    const existing = await em.findOne(User, { username: options.username });
    if (existing) {
      return {
        errors: [
          {
            field: "username",
            message: "This username is already in use",
          },
        ],
      };
    }
    if (options.username.length < 3) {
      return {
        errors: [
          {
            field: "username",
            message: "Username must be at least 3 characters",
          },
        ],
      };
    }
    if (options.password.length < 4) {
      return {
        errors: [
          {
            field: "password",
            message: "Password must be at least 4 characters",
          },
        ],
      };
    }
    const password = await hash(options.password);
    const user = em.create(User, { username: options.username, password });
    await em.persistAndFlush(user);

    req.session.userId = user.id;
    return { user };
  }

  // ! Login
  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: ResolverContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "That username doesn't exist.",
          },
        ],
      };
    }

    const valid = await verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Invalid credentials, make sure your password is correct.",
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }
  /* 
  @Query(() => [User])
  users(@Ctx() { em }: ResolverContext): Promise<User[]> {
    return em.find(User, {});
  }

  @Mutation(() => Boolean)
  async deleteUser(
    @Arg("id") id: number,
    @Ctx() { em }: ResolverContext
  ): Promise<Boolean> {
    await em.nativeDelete(User, { id }).catch(() => {
      return false;
    });
    return true;
  } */
}
