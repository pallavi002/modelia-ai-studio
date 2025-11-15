import { useEffect, useState } from "react";
import { fetchHistory } from "../services/generatios";

export default function Studio() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function handleGenerate() {
    setIsGenerating(true);

    // placeholder — will be replaced in Step 5
    setTimeout(() => {
      alert("Mock generation completed (placeholder)");
      setIsGenerating(false);
    }, 1200);
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchHistory(token)
      .then((data) => setHistory(data))
      .catch(() => console.log("history load failed (mock for now)"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-6">
      <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-sm space-y-6">

        {/* HEADER */}
        <h1 className="text-2xl font-semibold text-gray-800">AI Studio</h1>

        {/* IMAGE UPLOAD */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="block w-full border rounded-lg p-2 text-sm"
          />

          {/* Preview */}
          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              className="w-full h-64 object-cover rounded-lg border"
            />
          )}
        </div>

        {/* PROMPT */}
        <div>
          <label className="text-sm font-medium text-gray-700">Prompt</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the desired output..."
            className="mt-1 w-full border rounded-lg p-2 text-sm"
          />
        </div>

        {/* STYLE */}
        <div>
          <label className="text-sm font-medium text-gray-700">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="mt-1 w-full border rounded-lg p-2 text-sm"
          >
            <option value="realistic">Realistic</option>
            <option value="studio">Studio Shot</option>
            <option value="artistic">Artistic</option>
          </select>
        </div>

        {/* GENERATE BUTTON */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-2 rounded-lg text-white font-medium transition
            ${isGenerating ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
        >
          {isGenerating ? "Generating…" : "Generate"}
        </button>

        {/* HISTORY SECTION */}
        <div className="pt-8">
          <h2 className="text-lg font-semibold mb-3">Recent Generations</h2>

          {history.length === 0 && (
            <p className="text-sm text-gray-500">No generations yet.</p>
          )}

          <div className="space-y-3">
            {history.map((item: any) => (
              <button
                key={item.id}
                onClick={() => {
                  setImagePreview(item.imageUrl);
                  setPrompt(item.prompt);
                  setStyle(item.style);
                }}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition w-full text-left"
              >
                <img
                  src={item.imageUrl}
                  className="w-14 h-14 object-cover rounded-md border"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.prompt}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
