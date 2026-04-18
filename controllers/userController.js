import { getAllUsers } from "../models/userModel.js";

export const fetchUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
