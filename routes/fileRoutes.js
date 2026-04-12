import express from "express";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import filesDbData from "../data/filesDb.json" with { type: "json" };
import foldersDbData from "../data/foldersDb.json" with { type: "json" };
import { writeFile } from "node:fs/promises";

const router = express.Router();

//read file
router.get("/:id", async (req, res) => {
  const base = path.resolve("./storage");
  const fileId = req.params.id;
  const fileData = filesDbData.find((file) => file.id === fileId);
  
  if (!fileData) {
    return res.status(404).json({ error: "File not found" });
  }
  
  const filePath = path.join(base, fileId + fileData.extension);

  if (!filePath.startsWith(base + path.sep)) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (req.query.action === "download") {
    res.set("Content-Disposition", "attachment");
  }
  return res.sendFile(`${filePath}`, (err) => {
    if (err) {
      console.log(err);
      res.json({ error: err });
    }
  });
});

//create file
router.post("/:parentDirId?", (req, res, next) => {
  const fileName = req.headers.filename || "untitled";
  const extension = path.extname(fileName);
  const parentDirId = req.params.parentDirId || null;
  const basePath = path.resolve("./storage");
  const id = crypto.randomUUID();
  const filePath = path.join(basePath, `${id}${extension}`);
  if(!parentDirId) {
    return res.status(400).json({ error: "Parent directory ID is required" });
  }
  const writeStream = createWriteStream(filePath);
  req.pipe(writeStream);

  
  const newFileData = {
    id,
    name: fileName,
    extension: path.extname(fileName),
    mimeType: fileName.split(".").pop(),
    parentDirId,
  };
  
  writeStream.on("finish", async () => {
    filesDbData.push(newFileData);
    const folderIndex = foldersDbData.findIndex((folder) => folder.id === parentDirId);
    if (folderIndex === -1) {
      return res.status(404).json({ error: "Parent folder not found" });
    }
    foldersDbData[folderIndex].files.push(id);
    try {
      await writeFile(
        "./data/filesDb.json",
        JSON.stringify(filesDbData),
      );
      await writeFile(
        "./data/foldersDb.json",
        JSON.stringify(foldersDbData),
      );
      return res.status(201).json({ message: "File uploaded successfully" });
    } catch (err) {
      next(err);
    }
  });

  writeStream.on("error", (err) => {
    next(err);
    res.status(500).json({ error: "Failed to upload file" });
  });
});

//update file name
router.patch("/:id", async (req, res) => {
  const fileId = req.params.id;
  let { newName } = req.body;
  newName = newName.trim();
  const fileIndex = filesDbData.findIndex(f => f.id === fileId);
  if (fileIndex === -1) {
    return res.status(404).json({ error: "File not found" });
  }
  if (!newName || typeof newName !== "string" || newName.trim() === "") {
    return res.status(400).json({ error: "Invalid file name" });
  }
  filesDbData[fileIndex].name = newName;

  try {
    await writeFile("./data/filesDb.json", JSON.stringify(filesDbData));
    return res.json({ msg: "File renamed successfully." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "could not rename file."
    })
  }
});

//delete file
router.delete("/:id", async (req, res) => {
  const fileId = req.params.id;
  if (!fileId) {
    return res.status(400).json({ error: "File ID is required" });
  }
  const fileIndex = filesDbData.findIndex(f => f.id === fileId);
  if (fileIndex === -1) {
    return res.status(404).json({ error: "File not found" });
  }
  const fileData = filesDbData[fileIndex];
  const extension = path.extname(fileData.name);
  const filePath = path.resolve(`./storage/${fileId}${extension}`);
  console.log(fileId);
  console.log("File found at index:", fileIndex);
  try {
    const parentDir = foldersDbData.find(folder => folder.id === fileData.parentDirId);
    if (!parentDir) {
      return res.status(404).json({ error: "Parent folder not found" });
    }
    await rm(filePath);
    filesDbData.splice(fileIndex, 1);
    parentDir.files = parentDir.files.filter(id => id !== fileId);
    await writeFile("./data/filesDb.json", JSON.stringify(filesDbData));
    await writeFile("./data/foldersDb.json", JSON.stringify(foldersDbData));
    return res.json({ msg: "File deleted successfully." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "could not delete file."
    })
  }
});


export default router;
