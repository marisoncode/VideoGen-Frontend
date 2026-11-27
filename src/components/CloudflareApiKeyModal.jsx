import React, { useState, useEffect } from 'react';
import { X, Check, ExternalLink, Cloud, ShieldCheck } from 'lucide-react';
import { apiUrl } from '../api';

export default function CloudflareApiKeyModal({ isOpen, onClose, onConfigSaved }) {
  const [accountId, setAccountId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [activeAccountPreview, setActiveAccountPreview] = useState('');
  const [activeTokenPreview, setActiveTokenPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch(apiUrl('/api/v1/cloudflare/status'))
        .then(res => res.json())
        .then(data => {
          if (data && data.configured) {
            setActiveAccountPreview(data.account_id_preview || '');
            setActiveTokenPreview(data.token_preview || '');
          }
        })
        .catch(err => console.error(err));
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!accountId.trim() || !apiToken.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter both your Cloudflare Account ID and API Token.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(apiUrl('/api/v1/cloudflare/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId.trim(),
          api_token: apiToken.trim()
        })
      });
      const data = await res.json();
      if (data.configured) {
        setStatusMsg({ type: 'success', text: 'Cloudflare Workers AI connected successfully! (10,000 free neurons/day)' });
        if (onConfigSaved) onConfigSaved(true);
        setTimeout(() => onClose(), 1200);
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to configure Cloudflare credentials.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-xl max-w-lg w-full p-6 relative space-y-4 text-slate-900 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="group absolute top-4 right-4 text-black p-1.5 rounded-lg hover:bg-slate-200/80 transition"
          title="Close"
        >
          <X className="w-4 h-4 transition-transform duration-300 ease-in-out group-hover:rotate-180" strokeWidth={3} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center border border-orange-600 shrink-0">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Cloudflare Workers AI</h3>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-bold">
                100% Free Daily FLUX
              </span>
            </div>
            <p className="text-xs text-slate-600">Official Black Forest Labs FLUX.1-schnell (10,000 free Neurons/day, no credit card)</p>
          </div>
        </div>

        {activeTokenPreview ? (
          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 flex items-center justify-between text-xs text-emerald-950">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Connected & Active</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-800">
                Account: {activeAccountPreview} • Token: {activeTokenPreview}
              </div>
            </div>
            <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
              Active
            </span>
          </div>
        ) : (
          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-300 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-slate-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>How to get your free Cloudflare credentials:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
              <li>Create a free account at <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5">dash.cloudflare.com <ExternalLink className="w-2.5 h-2.5" /></a> (no credit card required).</li>
              <li>In your Cloudflare dashboard sidebar, copy your <strong>Account ID</strong>.</li>
              <li>Go to <strong>My Profile → API Tokens → Create Token</strong>, choose <strong>Workers AI</strong> template, and create an API Token.</li>
            </ol>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              Cloudflare Account ID:
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. 7f8a9b2c3d4e5f6a..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              Cloudflare API Token:
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="e.g. abcdef123456_..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          {statusMsg && (
            <div className={`p-2.5 rounded-lg text-xs font-medium border ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'}`}>
              {statusMsg.text}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white border border-orange-700 transition flex items-center gap-1.5"
            >
              {loading ? 'Saving...' : 'Save Cloudflare Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
