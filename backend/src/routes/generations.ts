import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createGeneration, getGenerations, upload } from "../controllers/generationsController";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /generations - Create a new generation
router.post("/", upload.single("imageUpload"), createGeneration);

// GET /generations?limit=5 - Get user's generations
router.get("/", getGenerations);

export default router;

