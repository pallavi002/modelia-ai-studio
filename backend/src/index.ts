import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import generateRoute from "./routes/generate";
import imageRoutes from "./routes/imageRoutes";
import generationsRouter from "./routes/generations";
import path from "path";

dotenv.config();
export const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/auth", authRouter);
app.use("/api/generate", generateRoute);
app.use("/api", imageRoutes);
app.use("/generations", generationsRouter);

app.get("/", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
