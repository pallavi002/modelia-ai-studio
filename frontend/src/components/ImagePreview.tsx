interface ImagePreviewProps {
  data?: {
    url: string;
    prompt: string;
  } | null;
  loading: boolean;
}

export default function ImagePreview({ data, loading }: ImagePreviewProps) {
  if (loading)
    return <div className="text-center text-gray-500">Generating image...</div>;

  if (!data)
      return <div className="text-center text-gray-400">No image generated yet</div>;
  
    return (
      <div className="flex flex-col items-center gap-3">
        <img
          src={data.url}
          alt="Generated AI"
          className="rounded-xl shadow-md max-w-md"
        />
        <p className="text-sm text-gray-600">{data.prompt}</p>
      </div>
    );
  }
  