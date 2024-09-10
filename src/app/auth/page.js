'use client'
import { useState } from 'react';

import { auth } from '../firebase.config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import Cookies from 'universal-cookie';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
 
const cookie = new Cookies()
  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
    setError('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      cookie.set('isAuthenticated', true);
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="h-screen w-full bg-zinc-900 flex justify-center items-center">
      <div className="relative p-8 rounded-lg shadow-lg sm:w-[40%] w-[80%] bg-zinc-800">
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-center">
          <button
            className={`p-2 w-1/2 rounded-t-lg ${!isSignUp ? 'bg-zinc-700' : 'bg-zinc-800 text-gray-400'}`}
            onClick={toggleAuthMode}
          >
            Sign In
          </button>
          <button
            className={`p-2 w-1/2 rounded-t-lg ${isSignUp ? 'bg-zinc-700' : 'bg-zinc-800 text-gray-400'}`}
            onClick={toggleAuthMode}
          >
            Sign Up
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white mt-12">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h1>
        {error && <p className="text-red-500">{error}</p>}
        <form className="mt-4" onSubmit={handleAuth}>
          <div className="mb-4">
            <label className="block text-white">Email</label>
            <input
              type="email"
              className="w-full p-2 rounded-lg bg-zinc-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white">Password</label>
            <input
              type="password"
              className="w-full p-2 rounded-lg bg-zinc-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-zinc-600 text-white p-2 rounded-lg">
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
