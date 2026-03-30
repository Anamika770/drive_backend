import express from "express";
import cors from "cors";
import fileRoutes from "./routes/fileRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";
import { rm } from "fs/promises";
import path from "node:path";

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log("REQ =>", req.method, req.url);
  next();
});

app.use("/file", fileRoutes);
app.use("/folder", folderRoutes);

app.delete("/delete/:path(*)", async (req, res) => {
  const base = path.resolve("./storage");
  console.log("base=>", base);
  const filePath = path.join(base, "/", req.params.path);
  console.log("delete filepath=>", filePath);
  await rm(filePath, { recursive: true }, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });
  res.json({ message: "File deleted successfully" });
});

app.listen("80", () => {
  console.log("Server is running on port 80");
});
