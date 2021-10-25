import { ResolverContext } from "../types";
import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";
import { User } from "../entities/User";
import { UserResponse } from "../utils/UserResponse";
import { generateError } from "../utils/generateError";
import { passwordValidator } from "./passwordValidator";

export const validateRegister = async (
  options: UsernamePasswordInput,
  { em }: ResolverContext
): Promise<UserResponse | null> => {
  const usernameInUse = await em.findOne(User, { username: options.username });
  if (usernameInUse) {
    return generateError("username", "This username is already in use");
  }
  if (options.username.includes("@")) {
    return generateError("username", 'Username can\'t include an "@"');
  }
  if (options.username.length < 3) {
    return generateError("username", "Username must be at least 3 characters");
  }
  const emailInUse = await em.findOne(User, { email: options.email });
  if (emailInUse) {
    return generateError("email", "This email is already in use");
  }
  if (!options.email.includes("@")) {
    return generateError("email", "Invalid email adress");
  }
  const passwordInvalid = passwordValidator(options.password);
  if (passwordInvalid) {
    return passwordInvalid;
  }
  return null;
};
