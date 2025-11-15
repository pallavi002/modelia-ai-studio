import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";

dotenv.config();
export const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);

app.get("/", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
