
import React from 'react';
import { AsciiConfig, CharSets, ImageFilter } from '../types';
import { Settings, Sliders, Hash, RotateCcw, Keyboard, Palette, Undo2, Redo2, Wand2 } from 'lucide-react';

interface SettingsPanelProps {
  config: AsciiConfig;
  setConfig: (config: AsciiConfig | ((prev: AsciiConfig) => AsciiConfig)) => void;
  texts: any;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  config, 
  setConfig, 
  texts,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const handleSetChange = (val: string) => {
    setConfig(prev => ({ ...prev, charSet: val }));
  };

  const filters: ImageFilter[] = ['none', 'blur', 'sharpen', 'sepia', 'grayscale'];

  return (
    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">{texts.title}</h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${
              canUndo 
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' 
                : 'text-zinc-700 cursor-not-allowed'
            }`}
            title={texts.undo}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${
              canRedo 
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' 
                : 'text-zinc-700 cursor-not-allowed'
            }`}
            title={texts.redo}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Width Control */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-zinc-400 flex items-center gap-1">
              <Hash className="w-4 h-4" /> {texts.resolution}
            </label>
            <span className="text-xs font-mono text-indigo-400">{config.width}px</span>
          </div>
          <input
            type="range"
            min="40"
            max="300"
            step="10"
            value={config.width}
            onChange={(e) => setConfig(prev => ({ ...prev, width: parseInt(e.target.value) }))}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Contrast Control */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-zinc-400 flex items-center gap-1">
              <Sliders className="w-4 h-4" /> {texts.contrast}
            </label>
            <span className="text-xs font-mono text-indigo-400">{config.contrast}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={config.contrast}
            onChange={(e) => setConfig(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Image Filter */}
        <div>
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-1 mb-2">
            <Wand2 className="w-4 h-4" /> {texts.filter}
          </label>
          <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-zinc-700 overflow-x-auto custom-scrollbar">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setConfig(prev => ({ ...prev, filter: f }))}
                className={`flex-1 min-w-fit px-3 py-1.5 text-[10px] rounded-md transition-all font-medium whitespace-nowrap ${
                  config.filter === f
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {texts.filters[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Character Set Selection */}
        <div>
          <label className="text-sm font-medium text-zinc-400 flex items-center gap-1 mb-2">
            <Keyboard className="w-4 h-4" /> {texts.charSet}
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
            {Object.entries(CharSets).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleSetChange(value)}
                className={`text-[10px] py-2 px-2 rounded-lg border transition-all truncate ${
                  config.charSet === value 
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800'
                }`}
                title={value}
              >
                {key.charAt(0) + key.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-2">
          {/* Color Mode Selector */}
          <div className="flex flex-col gap-2">
             <label className="text-sm font-medium text-zinc-400 flex items-center gap-1">
              <Palette className="w-4 h-4" /> {texts.colorMode}
            </label>
            <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-zinc-700">
              {(['mono', 'text', 'background'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setConfig(prev => ({ ...prev, colorMode: mode }))}
                  className={`flex-1 text-[10px] py-1.5 rounded-md transition-all font-medium ${
                    config.colorMode === mode
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {texts.modes[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Invert Toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-400 flex items-center gap-1">
              <RotateCcw className="w-4 h-4" /> {texts.invert}
            </label>
            <button
              onClick={() => setConfig(prev => ({ ...prev, invert: !prev.invert }))}
              className={`relative inline-flex h-9 w-full items-center justify-center rounded-lg border transition-all ${
                config.invert 
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              <span className="text-xs font-medium">{config.invert ? texts.toggles.inverted : texts.toggles.standard}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
