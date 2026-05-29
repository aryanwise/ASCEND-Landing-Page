'use client';
import { useState } from 'react';

const FORMSPREE_URL = 'https://formspree.io/f/mnjrjbag';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const data = new FormData();
      data.append('email', email);
      const res = await fetch(FORMSPREE_URL, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', background: 'rgba(27,122,92,0.15)', border: '1px solid #1B7A5C', padding: '20px', borderRadius: 14, color: '#D9F0E5', fontSize: 15 }}>
        <strong>You're in.</strong> We'll email you when early access opens.
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, maxWidth: 480, margin: '0 auto', background: 'rgba(255,255,255,0.06)', padding: 8, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
          style={{ flex: 1, minWidth: 200, background: 'transparent', border: 'none', padding: '12px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
        <button type="submit" disabled={status === 'loading'} style={{ background: '#D9531E', color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}>
          {status === 'loading' ? 'Sending...' : 'Join waitlist →'}
        </button>
      </form>
      {status === 'error' && <p style={{ color: '#D9531E', fontSize: 12, marginTop: 8, textAlign: 'center' }}>Something went wrong. Please try again.</p>}
    </div>
  );
}
