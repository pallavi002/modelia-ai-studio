import api from "./api";

export interface Generation {
  id: number;
  prompt: string;
  style: string;
  imageUrl: string;
  createdAt: string;
  status: string;
}

export async function fetchHistory(): Promise<Generation[]> {
  const res = await api.get("/generations?limit=5");
  return res.data;
}

export async function createGeneration(
  prompt: string,
  style: string,
  imageFile?: File,
  signal?: AbortSignal
): Promise<Generation> {
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("style", style);
  if (imageFile) {
    formData.append("imageUpload", imageFile);
  }

  const res = await api.post("/generations", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    signal
  });
  return res.data;
}
  