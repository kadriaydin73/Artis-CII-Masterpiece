
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Download, Upload, Copy, Sparkles, Wand2, Terminal, Trash2, Languages } from 'lucide-react';
import { AsciiConfig, CharSets, ProcessingResult, Language } from './types';
import { analyzeAsciiArt } from './services/gemini';
import { processImageToAscii } from './utils/asciiUtils';
import SettingsPanel from './components/SettingsPanel';
import { translations } from './translations';

const STORAGE_KEY = 'artis_cii_session';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult>({ ascii: '', loading: false });
  const [lang, setLang] = useState<Language>('tr'); // Default to Turkish based on user request language
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  
  const initialConfig: AsciiConfig = {
    width: 100,
    charSet: CharSets.DEFAULT,
    invert: false,
    contrast: 100,
    colorMode: 'mono',
    filter: 'none'
  };

  const [config, setConfigState] = useState<AsciiConfig>(initialConfig);
  const [history, setHistory] = useState<AsciiConfig[]>([initialConfig]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = translations[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Check for saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.image && parsed.config) {
          setShowRestorePrompt(true);
        }
      } catch (e) {
        console.warn("Failed to parse saved session", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Auto-save session
  useEffect(() => {
    if (image) {
      const timeoutId = setTimeout(() => {
        try {
          const session = {
            image,
            config,
            timestamp: Date.now()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch (e) {
          console.warn("Failed to save session to localStorage", e);
        }
      }, 1000); // 1s debounce
      return () => clearTimeout(timeoutId);
    }
  }, [image, config]);

  const handleRestore = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setImage(parsed.image);
        setConfigState(parsed.config);
        setHistory([parsed.config]);
        setHistoryIndex(0);
      }
    } catch (e) {
      console.error("Restore failed", e);
    }
    setShowRestorePrompt(false);
  };

  const handleDiscard = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowRestorePrompt(false);
  };

  // Wrapper for setConfig to handle history with debounce
  const setConfig = useCallback((newConfigAction: AsciiConfig | ((prev: AsciiConfig) => AsciiConfig)) => {
    setConfigState(prevConfig => {
      const nextConfig = typeof newConfigAction === 'function' ? newConfigAction(prevConfig) : newConfigAction;
      
      // If no change, return previous
      if (JSON.stringify(nextConfig) === JSON.stringify(prevConfig)) return prevConfig;

      // Clear existing timeout to debounce history updates (e.g., for sliders)
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        setHistory(prevHist => {
          const newHist = prevHist.slice(0, historyIndex + 1);
          newHist.push(nextConfig);
          return newHist;
        });
        setHistoryIndex(prevIndex => prevIndex + 1);
      }, 400);

      return nextConfig;
    });
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setConfigState(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setConfigState(history[nextIndex]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAscii = useCallback(() => {
    if (!image || !canvasRef.current) return;

    const process = (img: HTMLImageElement) => {
      const { ascii, coloredHtml } = processImageToAscii(
        canvasRef.current!, 
        canvasRef.current!.getContext('2d')!, 
        img, 
        config
      );
      setResult(prev => ({ ...prev, ascii, coloredHtml }));
    };

    if (!imgRef.current) {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        imgRef.current = img;
        process(img);
      };
    } else {
      process(imgRef.current);
    }
  }, [image, config]);

  useEffect(() => {
    if (image) {
      generateAscii();
    }
  }, [image, config, generateAscii]);

  const handleAiAnalysis = async () => {
    if (!image) return;
    setResult(prev => ({ ...prev, loading: true }));
    const comment = await analyzeAsciiArt(image, lang);
    setResult(prev => ({ ...prev, aiComment: comment, loading: false }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.ascii);
    alert(t.copiedToast);
  };

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([result.ascii], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "masterpiece.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setImage(null);
    setResult({ ascii: '', loading: false });
    imgRef.current = null;
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'tr' : 'en');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Terminal className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t.title}</h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-400 text-xs font-bold"
          >
            <Languages className="w-3.5 h-3.5" />
            {lang === 'en' ? 'TR' : 'EN'}
          </button>

          {image && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-400 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" /> {t.reset}
            </button>
          )}
          <label className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95">
            <Upload className="w-4 h-4" />
            {t.upload}
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Settings */}
        <div className="lg:col-span-4 space-y-6">
          {!image ? (
            <div className="aspect-square rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <Camera className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{t.ready}</h3>
              <p className="text-sm text-zinc-500 mb-6">{t.dragDrop}</p>
              <label className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors cursor-pointer">
                {t.selectFile}
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <>
              <div className="relative group rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <img src={image} alt="Original" className="w-full aspect-auto object-contain max-h-[400px]" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs font-medium text-white bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md">{t.original}</span>
                </div>
              </div>
              <SettingsPanel 
                config={config} 
                setConfig={setConfig} 
                texts={t.settings}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
              />
            </>
          )}
        </div>

        {/* Right Column: ASCII Output */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative min-h-[500px] rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <span className="text-xs font-mono text-zinc-500">masterpiece.txt</span>
              </div>
              
              <div className="flex gap-2">
                {result.ascii && (
                  <>
                    <button 
                      onClick={handleAiAnalysis}
                      disabled={result.loading}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-xs font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {result.loading ? t.analyzing : t.aiFeedback}
                    </button>
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-400"
                      title={t.copy}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={downloadTxt}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-400"
                      title={t.download}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 md:p-12 custom-scrollbar">
              {!result.ascii ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4">
                  <Wand2 className="w-12 h-12 opacity-20" />
                  <p className="text-sm italic font-medium">{t.emptyState}</p>
                </div>
              ) : (
                <div className="ascii-output mono text-indigo-400 mx-auto w-fit leading-none">
                  {config.colorMode !== 'mono' && result.coloredHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: result.coloredHtml }} />
                  ) : (
                    result.ascii
                  )}
                </div>
              )}
            </div>

            {/* AI Comment Overlay */}
            {result.aiComment && (
              <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-indigo-600/10 backdrop-blur-xl border border-indigo-500/30 text-indigo-200 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium italic leading-relaxed">
                    "{result.aiComment}"
                  </p>
                </div>
                <button 
                  onClick={() => setResult(prev => ({ ...prev, aiComment: undefined }))}
                  className="absolute top-2 right-2 p-1 text-indigo-400/50 hover:text-indigo-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          
          {/* Footer Info */}
          <div className="flex justify-between items-center px-4 py-2 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            <span>{t.footer.powered}</span>
            <span>{t.footer.crafted}</span>
          </div>
        </div>
      </main>

      {/* Restore Session Modal */}
      {showRestorePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-indigo-400">
              <Sparkles className="w-6 h-6" />
              <h3 className="text-xl font-bold text-white">{t.restoreSession.title}</h3>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {t.restoreSession.message}
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleDiscard}
                className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
              >
                {t.restoreSession.discard}
              </button>
              <button 
                onClick={handleRestore}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-600/20"
              >
                {t.restoreSession.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
