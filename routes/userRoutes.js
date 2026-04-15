import express from "express";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import foldersDbData from "../data/foldersDb.json" with { type: "json" };
import usersDbData from "../data/usersDb.json" with { type: "json" };
import { writeFile } from "node:fs/promises";

const router = express.Router();

//register user
router.post("/register", express.json(), async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const existingUser = usersDbData.find((user) => user.username === username);

  if (existingUser) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const userId = crypto.randomUUID();
  const rootDirId = crypto.randomUUID();
  const rootFolderData = {
    id: rootDirId,
    name: `root-${username}`,
    parentDirId: null,
    user: userId,
    files: [],
    folders: [],
  };
  foldersDbData.push(rootFolderData);

  const newUser = {
    id: userId,
    username: username,
    password: password,
    rootFolderId: rootDirId
  };
  usersDbData.push(newUser);

  try {
    await writeFile("./data/usersDb.json", JSON.stringify(usersDbData));
    await writeFile("./data/foldersDb.json", JSON.stringify(foldersDbData));
    res.cookie("userId", user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    }); return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

//login user
router.post("/login", express.json(), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const user = usersDbData.find((user) => user.username === username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  res.cookie("userId", user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false
  }); return res.json({ message: "Login successful", userId: user.id, rootFolderId: user.rootFolderId });
});

//logout user
router.post("/logout", (req, res) => {
  res.clearCookie("userId");
  return res.json({ message: "Logout successful" });
});

export default router;
