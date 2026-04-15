import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authMiddleware from "./auth/authMiddleware.js";
import fileRoutes from "./routes/fileRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  
}));
app.use(cookieParser());

// app.use((req, res, next) => {
//   console.log("REQ =>", req.method, req.url);
//   next();
// });

app.use("/file", authMiddleware, fileRoutes);
app.use("/folder", authMiddleware, folderRoutes);
app.use("/user", userRoutes);

app.use((err, req, res) => {
  console.error(err); 
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen("80", () => {
  console.log("Server is running on port 80");
});
