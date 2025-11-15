import { useState } from "react";
import api from "../services/api";

export default function Studio() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/generate", { prompt });
      setImageUrl(res.data.imageUrl);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Image Generation Studio</h1>

      <input
        type="text"
        className="border p-2 w-full rounded-lg mb-4"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the image you want..."
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate"}
      </button>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      {imageUrl && (
        <div className="mt-6">
          <img src={imageUrl} alt="generated" className="rounded-lg" />
        </div>
      )}
    </div>
  );
}
