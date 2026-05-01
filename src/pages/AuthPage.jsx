import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function AuthPage() {
  const { loginGoogle, loginEmail, signupEmail } = useAuth();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Email and password required');
    if (tab === 'signup' && !name) return setError('Name required');
    
    setError('');
    setLoading(true);
    
    try {
      if (tab === 'login') {
        await loginEmail(email, password);
      } else {
        await signupEmail(email, password, name);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div id="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Where it Went?</div>
        <p className="auth-sub">Track your money. Own your future.</p>
        
        <div className="auth-tabs">
          <div className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Log In</div>
          <div className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Sign Up</div>
        </div>
        
        {error && <div className="auth-err" style={{display: 'block'}}>{error}</div>}
        
        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        
        <div className="auth-divider">or</div>
        
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          
          <div className="auth-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          
          {tab === 'signup' && (
            <div className="auth-field">
              <label>Your Name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Alex" />
            </div>
          )}
          
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Processing...' : (tab === 'login' ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        
        <p className="auth-hint">Secure authentication via Firebase</p>
      </div>
    </div>
  );
}

export default AuthPage;
