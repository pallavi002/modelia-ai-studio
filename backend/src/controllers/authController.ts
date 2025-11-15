import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../index";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const JWT_SECRET: string = process.env.JWT_SECRET || "devsecret";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

export const signupController = async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(parsed.password, 10);
    const user = await prisma.user.create({
      data: { email: parsed.email, password: hashed, name: parsed.name ?? null }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.flatten() });
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(parsed.password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ errors: err.flatten() });
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
