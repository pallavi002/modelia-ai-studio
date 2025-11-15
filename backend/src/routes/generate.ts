import { Router } from "express";

const router = Router();

/**
 * POST /api/generate
 * Body: { prompt: string }
 * Returns: { imageUrl: string }
 */
router.post("/", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Mock URL for now
  const mockUrl = `https://picsum.photos/seed/${encodeURIComponent(
    prompt
  )}/512/512`;

  return res.json({ imageUrl: mockUrl });
});

export default router;
