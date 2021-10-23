export const __prod__ = process.env.NODE_ENV !== "production";
export const __db_user__ = process.env.__db_user__ ?? "root";
export const __db_password__ = process.env.__db_password__ ?? "root";
