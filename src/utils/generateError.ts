import { UserResponse } from "./UserResponse";

export const generateError = (field: string, message: string): UserResponse => {
  return { errors: [{ field, message }] } as UserResponse;
};
