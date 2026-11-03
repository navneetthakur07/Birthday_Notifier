import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

export default function OAuthCallback({ onComplete }) {
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('Connecting your Google Account via OAuth 2.0...');

  useEffect(() => {
    const handleExchange = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const errorParam = urlParams.get('error');

      if (errorParam) {
        setStatus('error');
        setMessage(`Google OAuth canceled or denied: ${errorParam}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code found in URL redirect.');
        return;
      }

      try {
        const redirectUri = window.location.origin + '/oauth2/callback';
        const res = await api.post('/api/oauth2/callback', {
          code: code,
          redirectUri: redirectUri,
        });

        setStatus('success');
        setMessage(res.data.message || 'Google OAuth 2.0 connected successfully!');

        // Clean query params from URL
        window.history.replaceState({}, document.title, window.location.pathname);

        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1500);
      } catch (err) {
        console.error('OAuth exchange error', err);
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Failed to exchange authorization code with Google. Please check your Client Secret.'
        );
      }
    };

    handleExchange();
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 max-w-md w-full text-center space-y-4">
        {status === 'processing' && (
          <>
            <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-base font-bold text-slate-800">Authorizing Google OAuth 2.0</h2>
            <p className="text-xs text-slate-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-emerald-800">Connected Successfully!</h2>
            <p className="text-xs text-slate-600">{message}</p>
            <p className="text-[11px] text-slate-400">Redirecting to Admin Dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-rose-800">Connection Failed</h2>
            <p className="text-xs text-slate-600">{message}</p>
            <button
              onClick={() => {
                window.history.replaceState({}, document.title, '/');
                if (onComplete) onComplete();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Return to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

