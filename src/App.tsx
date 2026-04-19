import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Download, 
  Image as ImageIcon,
  Loader2,
  Trash2,
  Info,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { enhancePrompt, generateImage, GeneratedImage } from "./services/geminiService";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Preparing canvas...");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Photorealism");

  const loadingMessages = [
    "Mixing digital pigments...",
    "Defining the light signature...",
    "Sketching ethereal boundaries...",
    "Applying quantum brushstrokes...",
    "Crystallizing your imagination...",
    "Finalizing the artistic vision..."
  ];

  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      let idx = 0;
      interval = window.setInterval(() => {
        idx = (idx + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[idx]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("artisgen_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) setCurrentImage(parsed[0]);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("artisgen_history", JSON.stringify(history));
    }
  }, [history]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      const enhanced = await enhancePrompt(prompt);
      const result = await generateImage(prompt, enhanced);
      setCurrentImage(result);
      setHistory(prev => [result, ...prev].slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (img: GeneratedImage) => {
    const link = document.createElement("a");
    link.href = img.url;
    link.download = `artisgen-${img.prompt.slice(0, 20).replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeFromHistory = (timestamp: number) => {
    setHistory(prev => prev.filter(item => item.timestamp !== timestamp));
  };

  const styles = ["Photorealism", "Digital Art", "Oil Painting", "Anime"];

  return (
    <div className="flex h-screen bg-bg-deep text-text-main overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-[300px] bg-bg-surface border-r border-border flex flex-col p-6 shrink-0 h-full overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">LUMINA AI</span>
        </div>

        <div className="space-y-8 flex-1">
          <div className="flex flex-col gap-3">
            <label className="sidebar-label">Prompt Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision..."
              className="sleek-input min-h-[140px] resize-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="sidebar-label">Model Style</label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((style) => (
                <button
                  key={style}
                  onClick={() => setActiveTab(style)}
                  className={`text-[12px] py-2 px-1 rounded-md border transition-all ${
                    activeTab === style 
                      ? 'bg-accent border-accent text-white font-semibold' 
                      : 'bg-bg-deep border-border text-text-dim hover:border-text-dim/30'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="sidebar-label">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-2">
              {["1:1 Square", "16:9 Cinema", "9:16 Mobile", "4:3 Classic"].map((ratio) => (
                <button
                  key={ratio}
                  className="text-[12px] py-2 px-1 rounded-md border border-border bg-bg-deep text-text-dim hover:border-text-dim/30 transition-all first:border-accent first:text-text-main"
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => handleGenerate()}
          disabled={isGenerating || !prompt.trim()}
          className="mt-10 btn-accent flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:grayscale transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Masterpiece</span>
            </>
          )}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top bar */}
        <header className="h-16 border-b border-border px-8 flex items-center justify-between shrink-0 bg-bg-deep/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="badge">Seed: {currentImage?.timestamp || 0}</span>
            <span className="badge">Sampler: DPM++</span>
            <span className="badge">V2.5 Engine</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={() => handleGenerate()}>
              <Maximize2 className="w-3 h-3 inline-block mr-1" />
              Upscale 4x
            </button>
            <button 
              className="btn-ghost" 
              disabled={!currentImage}
              onClick={() => currentImage && downloadImage(currentImage)}
            >
              <Download className="w-3 h-3 inline-block mr-1" />
              Download
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden relative flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,#111114_0%,#08080a_100%)]">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 blur-3xl animate-pulse rounded-full" />
                  <Loader2 className="w-12 h-12 text-accent animate-spin relative z-10" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-text-main animate-pulse">{loadingMessage}</p>
                  <p className="text-[10px] text-text-dim mt-2 tracking-[0.2em] uppercase">Neural Engine Active</p>
                </div>
              </motion.div>
            ) : currentImage ? (
              <motion.div 
                key={currentImage.timestamp}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="art-frame group"
              >
                <img 
                  src={currentImage.url} 
                  alt={currentImage.prompt} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-5 left-5 right-5 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-accent tracking-widest">{activeTab} Render</span>
                    <p className="text-[13px] text-white/90 line-clamp-1 italic font-medium leading-relaxed">"{currentImage.prompt}"</p>
                    <span className="text-[11px] text-text-dim mt-1">1024x1024 • 8k Res • 3.2s load</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 text-text-dim/30"
              >
                <div className="w-20 h-20 rounded-full bg-border flex items-center justify-center opacity-50">
                  <ImageIcon className="w-10 h-10" />
                </div>
                <p className="text-sm font-medium tracking-wide italic">Digital Canvas awaits your vision</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-full text-sm font-medium flex items-center gap-3 backdrop-blur-md"
              >
                <Info className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Strip */}
        <div className="h-28 bg-bg-surface border-t border-border p-4 flex items-center gap-4 overflow-x-auto shrink-0 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {history.map((item) => (
              <motion.div
                layout
                key={item.timestamp}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setCurrentImage(item)}
                className={`group relative shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  currentImage?.timestamp === item.timestamp ? 'border-accent shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'border-border hover:border-text-dim/30'
                }`}
              >
                <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); downloadImage(item); }}
                    className="p-1.5 bg-bg-surface/80 rounded-md hover:bg-accent text-white transition-colors"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFromHistory(item.timestamp); }}
                    className="p-1.5 bg-bg-surface/80 rounded-md hover:bg-red-500 text-white transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {history.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[11px] text-text-dim/50 uppercase tracking-[0.2em]">Recently generated art will appear here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
