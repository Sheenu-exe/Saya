'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/firebase.config';
import Cookies from 'universal-cookie';

const AuthGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const cookies = new Cookies();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        cookies.remove('isAuthenticated', { path: '/' });
        router.push('/auth/signIn');
      } else {
        cookies.set('isAuthenticated', true, {
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return children;
};

export default AuthGuard;