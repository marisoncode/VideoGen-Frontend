import React, { useState, useEffect } from 'react';
import { X, Check, ExternalLink, Key } from 'lucide-react';
import { apiUrl } from '../api';

export default function ReplicateApiKeyModal({ isOpen, onClose, onConfigSaved }) {
  const [apiToken, setApiToken] = useState('');
  const [activePreview, setActivePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch(apiUrl('/api/v1/replicate/status'))
        .then(res => res.json())
        .then(data => {
          if (data && data.configured) {
            setActivePreview(data.token_preview || '');
          }
        })
        .catch(err => console.error(err));
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(apiUrl('/api/v1/replicate/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_token: apiToken.trim() })
      });
      const data = await res.json();
      if (data.configured) {
        setStatusMsg({ type: 'success', text: 'Replicate API Token connected successfully!' });
        if (onConfigSaved) onConfigSaved(true);
        setTimeout(() => onClose(), 1000);
      } else {
        setStatusMsg({ type: 'error', text: 'Please enter a valid Replicate API token (starts with r8_).' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-xl max-w-md w-full p-6 relative space-y-4 text-slate-900 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="group absolute top-4 right-4 text-slate-900 hover:text-black p-1.5 rounded-lg hover:bg-slate-100 transition"
          title="Close"
        >
          <X className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center border border-blue-700">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Replicate API Configuration</h3>
            <p className="text-xs text-slate-600">Required for 16:9 FLUX images & LTX-Video animations</p>
          </div>
        </div>

        {activePreview ? (
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex items-center justify-between text-xs text-slate-800">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Token: <strong className="font-mono">{activePreview}</strong></span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold border border-emerald-300">
              Connected
            </span>
          </div>
        ) : (
          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-300 leading-relaxed">
            Obtain your API token from your Replicate account at{' '}
            <a
              href="https://replicate.com/account/api-tokens"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5"
            >
              replicate.com/account/api-tokens <ExternalLink className="w-3 h-3" />
            </a>
            . Tokens begin with <code className="font-mono font-semibold text-slate-900">r8_...</code>.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              Enter API Token:
            </label>
            <input
              type="password"
              required
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder={activePreview ? "Paste new token to replace (r8_...)" : "r8_..."}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono transition"
            />
          </div>

          {statusMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs font-semibold ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-red-50 text-red-800 border border-red-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition border border-blue-700"
            >
              {loading ? 'Connecting...' : 'Save Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
