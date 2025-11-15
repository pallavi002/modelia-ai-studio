import { Request, Response } from "express";
import GeneratedImage from "../models/GeneratedImage";

export const generateImage = async (req: Request, res: Response) => {
  try {
    const { prompt, size } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Mock result for now (will integrate actual API later)
    const generated = new GeneratedImage({
      prompt,
      size: size || "1024x1024",
      url: "https://placehold.co/600x400"
    });

    return res.status(200).json({ success: true, data: generated });
  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
