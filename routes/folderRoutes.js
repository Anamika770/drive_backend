import express from "express";
import filesDbData from "../data/filesDb.json" with { type: "json" };
import foldersDbData from "../data/foldersDb.json" with { type: "json" };
import { writeFile, rm } from "node:fs/promises";
import path from "node:path";

const router = express.Router();

//read folder and its content
router.get("/:folderId?", async (req, res) => {
  const folderId = req.params.folderId || "cbb5e4cf-6234-4041-8577-07c9a44e4a3d";

  const folderData = foldersDbData.find((folder) => folder.id === folderId);

  if (!folderData) {
    return res.status(404).json({ error: "Folder not found" });
  }
  const files = folderData.files.map(
    (fileId) => filesDbData.find((file) => file.id === fileId)
  );

  const folders = folderData.folders.map(
    (folderId) => foldersDbData.find((folder) => folder.id === folderId)
  );

  res.json({ ...folderData, files, folders });
});

//create folder
router.post("/:parentDirId?", async (req, res) => {
  const folderName = req.body.folderName || "New Folder";
  const parentDirId = req.params.parentDirId || null;
  const newFolderData = {
    id: crypto.randomUUID(),
    name: folderName,
    parentDirId: parentDirId,
    files: [],
    folders: [],
  };
  const folderData = foldersDbData.find((folder) => folder.id === parentDirId);
  if (!folderData) {
    return res.status(404).json({ error: "Parent folder not found" });
  }
  foldersDbData.push(newFolderData);
  folderData.folders.push(newFolderData.id);

  try {
    await writeFile('./data/foldersDb.json', JSON.stringify(foldersDbData));
    res.json({ msg: "folder created Successfully." });
  } catch (err) {
    res.json({ msg: err });
  }
});

//update folder name
router.patch("/:id", async (req, res) => {
  const folderId = req.params.id;
  let { newName } = req.body;
  newName = newName.trim();
  const folderIndex = foldersDbData.findIndex(f => f.id === folderId);
  if (folderIndex === -1) {
    return res.status(404).json({ error: "Folder not found" });
  }
  if (!newName || typeof newName !== "string" || newName.trim() === "") {
    return res.status(400).json({ error: "Invalid folder name" });
  }
  foldersDbData[folderIndex].name = newName;

  try {
    await writeFile("./data/foldersDb.json", JSON.stringify(foldersDbData));
    return res.json({ msg: "Folder renamed successfully." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "could not rename."
    })
  }
});

//delete folder
router.delete("/:id", async (req, res) => {
  const folderId = req.params.id;
  const folderIndex = foldersDbData.findIndex(f => f.id === folderId);
  if (folderIndex === -1) {
    console.log({ folderIndex });
    return res.status(404).json({ error: "Folder not found" });
  }

  function collectAll(folder) {
    let result = {
      folderIds: [folder.id],
      files: [...folder.files]
    };
    for (const subFolderId of folder.folders) {
      const subFolder = foldersDbData.find(f => f.id === subFolderId);
      if (subFolder) {
        const subResult = collectAll(subFolder);
        result.folderIds.push(...subResult.folderIds);
        result.files.push(...subResult.files);
      }
    }
    return result;
  }


  try {
    const { folderIds, files } = collectAll(foldersDbData[folderIndex]);
    for (const file of files) {
      await rm(`./storage/${file.id}${path.extname(file.name)}`);
    }
    filesDbData = filesDbData.filter(f => !files.some(df => df.id === f.id));
    foldersDbData = foldersDbData.filter(f => !folderIds.includes(f.id));
    await writeFile("./data/foldersDb.json", JSON.stringify(foldersDbData));
    await writeFile("./data/filesDb.json", JSON.stringify(filesDbData));
    return res.json({ msg: "Folder deleted successfully." });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "could not delete folder."
    })
  }
});

export default router;

