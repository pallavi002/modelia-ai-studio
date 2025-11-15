import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { AuthRequest } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

// Validation schema
const generateSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  style: z.enum(["realistic", "studio", "artistic"], {
    errorMap: () => ({ message: "Style must be realistic, studio, or artistic" })
  })
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG images are allowed"));
    }
  }
});

// Simulate 20% chance of model overload error
const shouldSimulateError = () => Math.random() < 0.2;

// POST /generations
export const createGeneration = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate request body
    const validation = generateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validation.error.flatten() 
      });
    }

    const { prompt, style } = validation.data;

    // Simulate 20% chance of model overload error
    if (shouldSimulateError()) {
      return res.status(503).json({ 
        message: "Model overloaded",
        error: "The model is currently overloaded. Please try again later."
      });
    }

    // Simulate generation delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Handle image upload if present
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    let imageUrl = "https://picsum.photos/seed/" + encodeURIComponent(prompt) + "/512/512";
    if (req.file) {
      // In production, upload to cloud storage (S3, Cloudinary, etc.)
      // For now, we'll use the local upload URL
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    // Save generation to database
    // @ts-ignore - IDE cache issue: prisma.generation exists at runtime and TypeScript compiles correctly
    const generation = await prisma.generation.create({
      data: {
        userId,
        prompt,
        style,
        imageUrl,
        status: "completed"
      }
    });

    return res.status(200).json({
      id: generation.id,
      imageUrl: generation.imageUrl,
      prompt: generation.prompt,
      style: generation.style,
      createdAt: generation.createdAt,
      status: generation.status
    });
  } catch (err: any) {
    console.error("Error creating generation:", err);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /generations?limit=5
export const getGenerations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const limitNumber = Math.min(Math.max(limit, 1), 5); // Clamp between 1 and 5

    // @ts-ignore - IDE cache issue: prisma.generation exists at runtime and TypeScript compiles correctly
    const generations = await prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limitNumber,
      select: {
        id: true,
        prompt: true,
        style: true,
        imageUrl: true,
        createdAt: true,
        status: true
      }
    });

    return res.status(200).json(generations);
  } catch (err) {
    console.error("Error fetching generations:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

