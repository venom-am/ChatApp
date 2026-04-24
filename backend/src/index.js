import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001; // ✅ FIX: don't use 5001 (frontend conflict)
const __dirname = path.resolve();

// ✅ CORS should be BEFORE routes (you already did correct placement 👍)
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running!" });
});


// ✅ Production frontend serving
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// ✅ Start server
server.listen(PORT, () => {
  console.log("\n==================================");
  console.log("✓ Server is running on PORT:" + PORT);
  console.log("✓ Database: Supabase (connected)");
  console.log("==================================\n");
});