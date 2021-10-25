import { UsernamePasswordInput } from "../inputs/UsernamePasswordInput";
import { User } from "../entities/User";
import { UserResponse } from "../objects/UserResponse";
import { generateError } from "../utils/generateError";
import { passwordValidator } from "./passwordValidator";

export const validateRegister = async (
  options: UsernamePasswordInput
): Promise<UserResponse | null> => {
  const usernameInUse = await User.findOne({
    where: { username: options.username },
  });
  if (usernameInUse) {
    return generateError("username", "This username is already in use");
  }
  if (options.username.includes("@")) {
    return generateError("username", 'Username can\'t include an "@"');
  }
  if (options.username.length < 3) {
    return generateError("username", "Username must be at least 3 characters");
  }
  const emailInUse = await User.findOne({ where: { email: options.email } });
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
