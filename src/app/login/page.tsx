'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, setLicenseKey } from '@/lib/auth';
import { apiCall } from '@/lib/api';
import { motion } from 'framer-motion';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiCall<{ token: string; role: 'admin' | 'user'; user_id: number }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      setToken(res.token);

      // We need a license key for users to connect to websocket. 
      // If user is not admin, we fetch their active license key.
      if (res.role === 'user') {
        const licRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/licenses?user_id=${res.user_id}`);
        const licData = await licRes.json();
        const activeLic = licData.licenses?.find((l: any) => l.status === 'active');
        if (activeLic) {
          setLicenseKey(activeLic.license_key);
        } else {
          // fallback if somehow they don't have active license
          setLicenseKey('');
        }
      }

      if (res.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card max-w-sm w-full p-6 text-center"
      >
        <div className="logo mb-6 text-4xl">F4R</div>
        <h1 className="text-xl font-bold mb-6 text-primary">Login to Services</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input text-center text-lg w-full"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input text-center text-lg w-full"
            required
          />
          
          <button 
            type="submit" 
            className="btn btn-primary w-full py-3 mt-4"
            disabled={loading || !username || !password}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
