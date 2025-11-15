import { Router } from "express";
import { generateImage } from "../controllers/imageController";

const router = Router();

// POST /api/generate
router.post("/generate", generateImage);

export default router;
