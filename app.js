import express from "express";
import cors from "cors";
import fileRoutes from "./routes/fileRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";

const app = express();
app.use(cors());

app.use((req, res, next) => {
  console.log("REQ =>", req.method, req.url);
  next();
});

app.use("/file", fileRoutes);
app.use("/folder", folderRoutes);

app.use((err, req, res, next) => {
  console.error(err); 
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen("80", () => {
  console.log("Server is running on port 80");
});
