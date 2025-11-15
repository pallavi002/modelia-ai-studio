import { useState } from "react";

interface PromptInputProps {
  onGenerate: (params: { prompt: string; size: string }) => void;
  loading: boolean;
}

export default function PromptInput({ onGenerate, loading }: PromptInputProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [size, setSize] = useState<string>("1024x1024");

  const submit = () => {
    if (!prompt.trim()) return;
    onGenerate({ prompt, size });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3 w-full">
      <textarea
        className="border p-3 rounded-xl w-full"
        rows={3}
        placeholder="Enter your prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <select
        className="border px-3 py-2 rounded-xl"
        value={size}
        onChange={(e) => setSize(e.target.value)}
      >
        <option value="512x512">512×512</option>
        <option value="1024x1024">1024×1024</option>
        <option value="2048x2048">2048×2048</option>
      </select>

      <button
        onClick={submit}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800"
      >
        {loading ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}
