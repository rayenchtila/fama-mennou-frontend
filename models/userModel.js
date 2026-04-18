import db from "../config/db.js";

export const getAllUsers = async () => {
  const result = await db.query("SELECT * FROM users");
  return result.rows;
};
