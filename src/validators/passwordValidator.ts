import { UserResponse } from "../objects/UserResponse";
import { generateError } from "../utils/generateError";

export const passwordValidator = (password: string): UserResponse | null => {
  if (password.length < 4) {
    return generateError("password", "Password must be at least 4 characters");
  }
  return null;
};
