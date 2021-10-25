import { User } from "../entities/User";
import {
  Resolver,
  Mutation,
  Arg,
  Ctx,
  Query,
  FieldResolver,
  Root,
} from "type-graphql";
import { hash, verify } from "argon2";
import type { ResolverContext } from "../types";
import { COOKIE, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "../inputs/UsernamePasswordInput";
import { validateRegister } from "../validators/validateRegister";
import { UserResponse } from "../objects/UserResponse";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { passwordValidator } from "../validators/passwordValidator";

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: ResolverContext): String {
    if (req.session.userId === user.id) {
      // User is fetching it's own email
      return user.email;
    }
    // User if not fetching it's own email
    return "";
  }

  // ! Reset Password
  @Mutation(() => UserResponse)
  async resetPassword(
    @Arg("token") token: string,
    @Arg("password") password: string,
    @Ctx() { redis, req }: ResolverContext
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

    const parsedUserId = parseInt(userId);
    const user = await User.findOne(parsedUserId);

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

    await User.update({ id: parsedUserId }, { password: await hash(password) });
    await redis.del(key);

    // * Login user
    req.session.userId = user.id;

    return { user };
  }
  // ! Forgot Password
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: ResolverContext
  ): Promise<Boolean> {
    const user = await User.findOne({ where: { email } });
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
  me(@Ctx() { req }: ResolverContext): Promise<User | undefined> {
    if (!req.session.userId) {
      return new Promise((res) => res(undefined));
    }

    return User.findOne(req.session.userId);
  }

  // ! Register
  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { req }: ResolverContext
  ): Promise<UserResponse> {
    const invalid = await validateRegister(options);
    if (invalid) {
      return invalid;
    }
    const password = await await hash(options.password);
    const user = await User.create({
      username: options.username,
      password,
      email: options.email,
    }).save();

    req.session.userId = user.id;
    return { user };
  }

  // ! Login
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: ResolverContext
  ): Promise<UserResponse> {
    const user = await User.findOne({
      where: usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    });
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
        resolve(!err);
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
