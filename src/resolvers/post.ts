import { Post } from "../entities/Post";
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  Ctx,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
} from "type-graphql";
import { PostInput } from "../inputs/PostInput";
import { ResolverContext } from "../types";
import { isAuth } from "../middlewares/isAuthentificated";
import { getConnection } from "typeorm";
import { PaginatedPosts } from "../objects/PaginatedPosts";
import { buildSqlJson } from "../utils/buildSqlJson";

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  contentSnippet(@Root() root: Post): Promise<String> {
    return new Promise((res) => {
      res(
        `${
          root.content.length > 150
            ? root.content.slice(0, 150) + `...`
            : root.content
        }`
      );
    });
  }

  // ! Finds all posts
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const hasMoreLimit = realLimit + 1;

    const queryParams: any[] = [hasMoreLimit];

    if (cursor) {
      queryParams.push(new Date(parseInt(cursor)));
    }

    const userFields = ["id", "username", "email", "createdAt", "updatedAt"];

    const posts = await getConnection().query(
      `SELECT p.*, 
      json_build_object(
        ${buildSqlJson("u", userFields)}
      ) author 
      FROM post p 
      INNER JOIN public.user u on u.id = p."authorId"
      ${cursor ? `WHERE p."createdAt" < $2` : ``}
      ORDER BY p."createdAt" DESC
      LIMIT $1`,
      queryParams
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === hasMoreLimit,
    };
  }

  // ! Finds a specific post
  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  // ! Creates a post
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: ResolverContext
  ): Promise<Post> {
    return Post.create({ ...input, authorId: req.session.userId }).save();
  }

  // ! Updates a post
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      Post.update({ id }, { title });
    }

    return post;
  }

  // ! Deletes a post
  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<Boolean> {
    await Post.delete(id).catch(() => {
      return false;
    });
    return true;
  }
}
