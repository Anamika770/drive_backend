import express from "express";
import { readdir, mkdir } from "fs/promises";
import path from "node:path";
import filesDbData from "../data/filesDb.json" with { type: "json" };
import foldersDbData from "../data/foldersDb.json" with { type: "json" };

const router = express.Router();

async function getFiles(folderPath, res) {
  const files = await readdir(folderPath, { withFileTypes: true });
  res.json(
    files.map((file) => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      mimeType: file.isDirectory() ? null : `${file.name.split(".").pop()}`,
    })),
  );
}

router.get("/:path(*)?", async (req, res) => {
  const dirName = path.join("/", req.params.path ? req.params.path : "");
  const filePath = `./storage${dirName}`;
  // console.log('filepath=>', filePath);
  // console.log('dirName=>', dirName);

  try {
    await getFiles(filePath, res);
  } catch (err) {
    console.log(err);
  }
});

router.post("/:path(*)?", async (req, res) => {
  // const folderName = req.body.
  const filePath = path.join("/", req.params.path ? req.params.path : "");
  const fullFilePath = `./storage${filePath}`;
  console.log(fullFilePath);

  try {
    await mkdir(fullFilePath, { recursive: true });
    res.json({ msg: "folder created Successfully." });
  } catch (err) {
    res.json({ msg: err });
  }
});

export default router;
