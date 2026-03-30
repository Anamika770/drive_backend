import express from "express";
import path from "node:path";
import { createWriteStream } from "node:fs";
import filesDbData from "../data/filesDb.json" with { type: "json" };
import foldersDbData from "../data/foldersDb.json" with { type: "json" };
import { writeFile } from "node:fs/promises";

const router = express.Router();

router.get("/:path(*)?", async (req, res) => {
  // console.log(req.params.path);
  const base = path.resolve("./storage");
  const filePath = path.resolve(base, req.params.path ? req.params.path : "");
  // console.log('file', filePath);

  if (!filePath.startsWith(base + path.sep)) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (req.query.action === "download") {
    res.set("Content-Disposition", "attachment");
  }
  return res.sendFile(filePath, (err) => {
    if (err) {
      console.log(err);
      res.json({ error: err });
    }
  });
});

router.post("/upload/:path(*)?", async (req, res) => {
  const base = path.resolve("./storage");
  const filePath = path.join(base, "/", req.params.path ? req.params.path : "");
  console.log("req.params.path=>", req.params.path);
  console.log("base=>", base);
  console.log("filePath=>", filePath);
  console.log("path.extname=>", path.extname(filePath));
  console.log("path.basename=>", path.basename(filePath));
  const writeStream = createWriteStream(filePath);
  req.pipe(writeStream);

  req.on("end", () => {
    console.log("File uploaded successfully");
    res.json({ message: "File uploaded successfully" });
  });
});

export default router;
