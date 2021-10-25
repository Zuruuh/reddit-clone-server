import { User } from "../entities/User";
import { Resolver, Mutation, Arg, Ctx, Query } from "type-graphql";
import { hash, verify } from "argon2";
import type { ResolverContext } from "../types";
import { COOKIE, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../validators/validateRegister";
import { UserResponse } from "../utils/UserResponse";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { passwordValidator } from "../validators/passwordValidator";

@Resolver()
export class UserResolver {
  // ! Reset Password
  @Mutation(() => UserResponse)
  async resetPassword(
    @Arg("token") token: string,
    @Arg("password") password: string,
    @Ctx() { redis, em, req }: ResolverContext
  ): Promise<UserResponse> {
    const passwordInvalid = passwordValidator(password);

    if (!!passwordInvalid) {
      return passwordInvalid;
    }

    const key = `${FORGOT_PASSWORD_PREFIX}${token}`;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "Invalid token",
          },
        ],
      };
    }

    const user = await em.findOne(User, { id: parseInt(userId) });

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "User no longer exists",
          },
        ],
      };
    }

    user.password = await hash(password);
    em.persistAndFlush(user);
    await redis.del(key);

    // * Login user
    req.session.userId = user.id;

    return { user };
  }
  // ! Forgot Password
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: ResolverContext
  ): Promise<Boolean> {
    const user = await em.findOne(User, { email });
    if (!user) {
      // This email is not currently in use
      return true;
    }

    const token = v4();
    await redis.set(
      `${FORGOT_PASSWORD_PREFIX}${token}`,
      user.id,
      "ex",
      1000 * 60 * 60 * 2
    );

    const href = `http://localhost:3000/reset-password/${token}`;
    await sendEmail(
      email,
      "Reddit - Reset your password",
      `<p>Hello ${user.username},</p><br><br>
       <p>You recently requested to reset your password.</p><br>
       <p>If you are at the origin of this action, click 
       <a href="${href}">here</a> to reset it.</p><br>
       <p>Else, you can just ignore this message</p>`
    );
    return true;
  }

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
    @Ctx() context: ResolverContext
  ): Promise<UserResponse> {
    const invalid = await validateRegister(options, context);
    if (invalid) {
      return invalid;
    }
    const { req, em } = context;
    const password = await await hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password,
      email: options.email,
    });
    await em.persistAndFlush(user);

    req.session.userId = user.id;
    return { user };
  }

  // ! Login
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: ResolverContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: `That ${
              usernameOrEmail.includes("@") ? "email" : "username"
            } does not exist.`,
          },
        ],
      };
    }

    const valid = await verify(user.password, password);
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

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: ResolverContext): Promise<Boolean> {
    return new Promise((resolve) => {
      req.session.destroy((err: any) => {
        res.clearCookie(COOKIE);
        if (err) {
          console.log(err);
        }
        resolve(!!err);
        return;
      });
    });
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
