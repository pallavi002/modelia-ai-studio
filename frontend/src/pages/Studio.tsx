import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHistory, createGeneration, type Generation } from "../services/generations";
import AuthContext from "../context/AuthContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RETRIES = 3;

// Image resizing utility
function resizeImage(file: File, maxWidth: number = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create blob"));
              return;
            }
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          },
          file.type,
          0.9
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Studio() {
  const { signout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [history, setHistory] = useState<Generation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  function handleLogout() {
    signout();
    navigate("/login");
  }

  // Validate and handle file upload
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPEG and PNG images are allowed");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);

    // Create preview
    const url = URL.createObjectURL(file);
    setImagePreview(url);

    // Resize image if needed (bonus feature)
    resizeImage(file)
      .then((resized) => {
        setImageFile(resized);
      })
      .catch((err) => {
        console.error("Error resizing image:", err);
        setImageFile(file); // Fallback to original
      });
  }

  // Generate with retry logic
  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Prompt is required");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setRetryCount(0);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    await attemptGeneration(0);
  }

  async function attemptGeneration(attempt: number): Promise<void> {
    if (attempt >= MAX_RETRIES) {
      setError("Failed after 3 attempts. Please try again later.");
      setIsGenerating(false);
      return;
    }

    try {
      const result = await createGeneration(
        prompt,
        style,
        imageFile || undefined,
        abortControllerRef.current?.signal
      );
      
      // Success - reset state and refresh history
      setIsGenerating(false);
      setRetryCount(0);
      setImagePreview(result.imageUrl);
      
      // Refresh history
      loadHistory();
    } catch (err: any) {
      // Check if request was aborted
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        setIsGenerating(false);
        setError(null);
        return;
      }

      // Check for model overload error (503)
      if (err.response?.status === 503 || err.response?.data?.message === "Model overloaded") {
        const newAttempt = attempt + 1;
        setRetryCount(newAttempt);
        
        if (newAttempt < MAX_RETRIES) {
          // Exponential backoff: wait 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptGeneration(newAttempt);
        } else {
          setError("Model is overloaded. Please try again later.");
          setIsGenerating(false);
          return;
        }
      }

      // Other errors
      setError(err.response?.data?.error || err.message || "Generation failed");
      setIsGenerating(false);
    }
  }

  function handleAbort() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setError(null);
    setRetryCount(0);
  }

  function loadHistory() {
    fetchHistory()
      .then((data) => setHistory(data))
      .catch((err) => {
        console.error("Failed to load history:", err);
        // Don't show error to user for history load failures
      });
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function restoreGeneration(item: Generation) {
    setImagePreview(item.imageUrl);
    setPrompt(item.prompt);
    setStyle(item.style);
    setImageFile(null); // Clear file since we're using a URL
  }

  return (
    <div 
      className="min-h-screen p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 15%, #f093fb 30%, #4facfe 45%, #00f2fe 60%, #667eea 75%, #764ba2 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradient 20s ease infinite'
      }}
    >
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                }}
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 
                  className="text-4xl font-bold" 
                  id="studio-title"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  AI Studio
                </h1>
                <p className="text-sm text-gray-600 mt-1">Transform your ideas into stunning images</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-purple-200 rounded-xl">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                    }}
                  >
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700" aria-label={`Logged in as ${user.email}`}>
                    {user.name || user.email.split("@")[0]}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-4 focus:ring-violet-100"
                aria-label="Log out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Upload */}
            <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-6 space-y-5" role="region" aria-labelledby="upload-label">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                  }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <label id="upload-label" className="text-lg font-bold text-gray-800">
                  Upload Image
                </label>
              </div>
              
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFile}
                  disabled={isGenerating}
                  className="hidden"
                  aria-describedby="upload-help"
                  aria-invalid={error ? "true" : "false"}
                />
                <span 
                  className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: isGenerating 
                      ? '#9ca3af' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                  }}
                >
                  Choose File
                </span>
              </label>
              <p id="upload-help" className="text-xs text-gray-400">
                Max 10MB • JPEG or PNG only
              </p>

              {/* Preview */}
              {imagePreview && (
                <div className="relative group mt-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-2xl blur-2xl transform group-hover:scale-105 transition-transform"></div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="relative w-full h-96 object-cover rounded-2xl border-4 border-white shadow-2xl transform transition-transform group-hover:scale-[1.01]"
                    role="img"
                    aria-label="Image preview"
                  />
                </div>
              )}
            </div>

            {/* Prompt & Style */}
            <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-6 space-y-6">
              <div role="region" aria-labelledby="prompt-label">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
                    }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <label id="prompt-label" htmlFor="prompt-input" className="text-lg font-bold text-gray-800">
                    Prompt
                  </label>
                </div>
                <input
                  id="prompt-input"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the desired output... (e.g., 'A futuristic cityscape at sunset')"
                  disabled={isGenerating}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900 placeholder-gray-400 text-base"
                  aria-required="true"
                />
              </div>

              <div role="region" aria-labelledby="style-label">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <label id="style-label" htmlFor="style-select" className="text-lg font-bold text-gray-800">
                    Style
                  </label>
                </div>
                <select
                  id="style-select"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900 cursor-pointer text-base font-medium"
                  aria-label="Select generation style"
                >
                  <option value="realistic">📷 Realistic</option>
                  <option value="studio">🎬 Studio Shot</option>
                  <option value="artistic">🖼️ Artistic</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-sm text-red-600 shadow-lg animate-shake"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold">{error}</div>
                    {retryCount > 0 && (
                      <div className="mt-1 text-xs opacity-75">
                        Retry attempt {retryCount} of {MAX_RETRIES}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 relative overflow-hidden group
                  ${isGenerating || !prompt.trim() ? "cursor-not-allowed" : "hover:shadow-xl hover:scale-[1.02]"}`
                }
                style={{
                  background: isGenerating || !prompt.trim()
                    ? '#9ca3af'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                }}
                aria-busy={isGenerating}
                aria-describedby={isGenerating ? "generating-status" : undefined}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating{retryCount > 0 ? ` (${retryCount}/${MAX_RETRIES})` : ""}...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Image
                    </>
                  )}
                </span>
                {!isGenerating && !(!prompt.trim()) && (
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3d8f 50%, #d97ae8 100%)'
                    }}
                  ></div>
                )}
              </button>
              {isGenerating && (
                <button
                  onClick={handleAbort}
                  className="px-6 py-4 rounded-xl border-2 border-red-300 text-red-600 font-semibold bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all focus:outline-none focus:ring-4 focus:ring-red-100"
                  aria-label="Abort generation"
                >
                  Cancel
                </button>
              )}
            </div>
            {isGenerating && (
              <div id="generating-status" className="sr-only" aria-live="polite">
                Generating image, please wait
              </div>
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-6 sticky top-6" role="region" aria-labelledby="history-title">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                  }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 id="history-title" className="text-xl font-bold text-gray-800">
                  Recent Generations
                </h2>
              </div>

              {history.length === 0 && (
                <div className="text-center py-12">
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 50%, #f093fb20 100%)'
                    }}
                  >
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#667eea' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No generations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first masterpiece!</p>
                </div>
              )}

              <div className="space-y-3" role="list" aria-label="Generation history">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => restoreGeneration(item)}
                    disabled={isGenerating}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-purple-100 text-left group shadow-sm hover:shadow-md"
                    role="listitem"
                    aria-label={`Restore generation: ${item.prompt}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div 
                        className="absolute inset-0 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                        }}
                      ></div>
                      <img
                        src={item.imageUrl}
                        alt={`Generated: ${item.prompt}`}
                        className="relative w-16 h-16 object-cover rounded-lg border-2 border-white shadow-md"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-sm font-semibold text-gray-800 truncate transition-colors"
                        style={{
                          color: 'inherit'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                      >
                        {item.prompt}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div 
                        className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-md capitalize"
                        style={{
                          background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 50%, #f093fb20 100%)',
                          color: '#667eea'
                        }}
                      >
                        {item.style}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
