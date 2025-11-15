import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api",
});

interface GenerateImageParams {
  prompt: string;
  size: string;
}

export const generateImage = async ({ prompt, size }: GenerateImageParams) => {
  const res = await API.post("/generate", { prompt, size });
  return res.data.data; 
};
