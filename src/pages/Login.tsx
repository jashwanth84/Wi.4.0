import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Trophy, ShieldAlert, LogIn, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const loginEmail = email.trim();
      if (!loginEmail.includes('@')) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, loginEmail, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in DB
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user profile for Google login
        await setDoc(userRef, {
          userId: user.uid,
          displayName: user.displayName || 'Player',
          email: user.email,
          username: user.email?.split('@')[0] || 'player',
          freeFireId: '',
          walletBalance: 0,
          bonusBalance: 0,
          totalEarnings: 0,
          role: 'user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black p-4 relative font-sans overflow-hidden">
      <div className="w-full max-w-[400px] mx-auto z-10 flex flex-col justify-center py-4">
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-white leading-tight tracking-wide">
            Welcome to,<br />Login
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-brand-red/10 border border-brand-red/20 flex items-start text-brand-red">
            <ShieldAlert className="h-5 w-5 mr-3 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full h-14 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-3xl px-6 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[15px]"
              />
            </div>
            
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-14 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-3xl px-6 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[15px]"
              />
            </div>

            <div className="flex justify-end pt-1">
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl text-base font-bold mt-4 transition-colors disabled:opacity-50 uppercase tracking-widest"
            >
              Login
            </button>
          </form>

          <div className="mt-8">
            <p className="text-center text-white mb-6 font-medium text-sm">or Login</p>
            
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-auto pt-16 pb-6">
            <p className="text-center text-sm text-white">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold hover:text-brand-purple transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
