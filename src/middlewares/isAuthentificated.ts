import { ResolverContext } from "src/types";
import { MiddlewareFn } from "type-graphql";

export const isAuth: MiddlewareFn<ResolverContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("001 - You must be authenticated to do this.");
  }
  return next();
};
