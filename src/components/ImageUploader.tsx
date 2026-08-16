import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertTriangle, Key, Trash } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export default function ImageUploader({ value, onChange, label = 'Image', placeholder = 'https://...' }: ImageUploaderProps) {
  const [apiKey, setApiKey] = useState(() => {
    // 1. Manual User override from localStorage takes absolute priority to prevent invalid env variables from blocking the app
    const stored = localStorage.getItem('imgbb_api_key');
    if (stored) return stored.trim();
    // 2. Env fallback or provided default key
    const envKey = (import.meta as any).env.VITE_IMGBB_API_KEY;
    if (envKey && envKey !== 'YOUR_CLIENT_API_KEY' && envKey !== '""') return envKey.trim();
    return '30ad2830ea186efa37379cc64a6f2a27'; // Default verified uploader key
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    // Sync with environment variable only if no local storage override is present
    const stored = localStorage.getItem('imgbb_api_key');
    if (!stored) {
      const envKey = (import.meta as any).env.VITE_IMGBB_API_KEY;
      if (envKey && envKey !== 'YOUR_CLIENT_API_KEY' && envKey !== '""') {
        setApiKey(envKey.trim());
      } else {
        setApiKey('30ad2830ea186efa37379cc64a6f2a27');
      }
    }
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('imgbb_api_key', key.trim());
    setError(null);
  };

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('imgbb_api_key');
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    const activeKey = apiKey.trim();
    if (!activeKey || activeKey === 'YOUR_CLIENT_API_KEY') {
      setError('ImgBB API Key is required for image upload. Please tap "Configure uploader" above to paste a key.');
      setShowKeyInput(true);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Call ImgBB API
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${activeKey}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onChange(data.data.url);
      } else {
        const errMsg = data.error?.message || '';
        if (errMsg.toLowerCase().includes('api v1 key') || response.status === 400) {
          setShowKeyInput(true);
          throw new Error('Invalid ImgBB API Key. Get a free key at https://api.imgbb.com and paste it below.');
        }
        throw new Error(errMsg || 'Failed to upload image. Please verify your API key.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        <button 
          type="button" 
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition"
        >
          <Key className="w-3.5 h-3.5" />
          {apiKey ? 'Edit Upload Key' : 'Configure Uploader'}
        </button>
      </div>

      {showKeyInput && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 p-3.5 rounded-xl border border-blue-100 flex flex-col gap-2.5 mb-1 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-blue-900 font-bold leading-normal">
              ImgBB Client API Key
            </span>
            <span className="text-[10px] text-zinc-500 leading-normal">
              Uploads are securely hosted on ImgBB. If you do not have a key, you can get a free one in 10 seconds:
              <a 
                href="https://api.imgbb.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 font-bold hover:underline mx-1"
                id="imgbb-signup-link"
              >
                Sign up at api.imgbb.com ↗
              </a>
            </span>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={apiKey} 
              onChange={(e) => saveApiKey(e.target.value)} 
              placeholder="Paste Key (e.g., 5ceeff9cc561...)" 
              className="flex-grow text-xs border border-blue-200 bg-white px-2.5 py-1.5 rounded-lg outline-none focus:border-blue-500 font-mono shadow-inner"
            />
            {apiKey && (
              <button 
                type="button"
                onClick={clearApiKey}
                className="text-xs bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold px-2 rounded-lg transition"
              >
                Clear
              </button>
            )}
            <button 
              type="button" 
              onClick={() => setShowKeyInput(false)}
              className="bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition shrink-0 shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Drag Drop Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${
          dragActive 
            ? 'border-blue-500 bg-blue-50/30' 
            : value 
              ? 'border-green-500/30 bg-green-50/5' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50/30'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            <p className="text-xs text-blue-600 font-semibold">Uploading to ImgBB...</p>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center w-full gap-3">
            {/* Thumbnail Preview */}
            <div className="relative w-full max-h-36 rounded-lg overflow-hidden border bg-gray-900/5 flex items-center justify-center">
              <img 
                src={value} 
                alt="Uploaded thumb" 
                className="max-h-36 object-contain pointer-events-none" 
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg hover:scale-105 transition"
                title="Remove image"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Manual URL Input as fallback */}
            <div className="w-full flex items-center gap-1.5">
              <div className="text-emerald-600 flex items-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-full font-mono text-[10px] bg-white border px-3 py-1.5 rounded-lg outline-none text-zinc-600 shrink-1" 
                placeholder={placeholder}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <div className="bg-gray-100 p-2.5 rounded-full mb-2">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs font-bold text-gray-700 mb-0.5">Drag & drop your game image</p>
            <p className="text-[10px] text-gray-400 mb-3">or tap below to choose flat file</p>
            
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition inline-block">
              Select File
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
          </div>
        )}
      </div>

      {/* Manual Input Fallback when no image is uploaded and want to paste directly */}
      {!value && !uploading && (
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-semibold text-zinc-400 shrink-0">OR Paste URL:</span>
          <input 
            type="url" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder="https://example.com/logo.png" 
            className="flex-grow border rounded bg-white text-xs px-2 py-1 outline-none font-mono focus:border-blue-500"
          />
        </div>
      )}

      {error && (
        <div className="flex gap-1.5 text-red-600 text-[11px] mt-1 pr-1 items-start bg-red-50/50 p-2 rounded-lg border border-red-100">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="leading-snug font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
