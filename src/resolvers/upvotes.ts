import { Upvote } from "../entities/Upvote";
import { Arg, Ctx, Int, Mutation, Resolver, UseMiddleware } from "type-graphql";
import type { ResolverContext } from "../types";
import { isAuth } from "../middlewares/isAuthentificated";
import { getConnection } from "typeorm";

@Resolver(Upvote)
export class UpvoteResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("post", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: ResolverContext
  ): Promise<Boolean> {
    const { userId } = req.session;
    const isUpvote = value !== -1;
    const realValue = isUpvote ? 1 : -1;

    /* Upvote.insert({
      userId,
      postId,
      value: realValue,
    }); */

    await getConnection().query(
      `
      START TRANSACTION;

      INSERT INTO upvote ("userId", "postId", "value") 
      VALUES (${userId},${postId},${realValue});

      UPDATE post
      SET score = score + ${realValue}
      WHERE id = ${postId};

      COMMIT;`
    );

    return true;
  }
}
