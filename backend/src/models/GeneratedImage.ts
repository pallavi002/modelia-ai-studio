export default class GeneratedImage {
    prompt: string;
    size: string;
    url: string;
    createdAt: Date;

    constructor({ prompt, size, url }: { prompt: string; size: string; url: string }) {
      this.prompt = prompt;
      this.size = size;
      this.url = url;
      this.createdAt = new Date();
    }
  }
  