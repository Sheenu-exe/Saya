'use client'
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, Cloud, Image, ChevronRight } from 'lucide-react';
import Cookies from "universal-cookie";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/firebase.config';

const SayaLanding = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const cookies = new Cookies();
      
      if (user) {
        cookies.set('isAuthenticated', true, {
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
        setIsAuthenticated(true);
        router.push("/home");
      } else {
        cookies.remove('isAuthenticated', { path: '/' });
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const renderAuthButton = () => {
    if (isAuthenticated) {
      return (
        <motion.a 
          href="/home"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-3 bg-white hover:bg-gray-50 text-indigo-600 rounded-md font-medium border border-indigo-200 flex items-center justify-center gap-2"
        >
          Go to Dashboard
        </motion.a>
      );
    }
    
    return (
      <motion.a 
        href="/auth/signIn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-8 py-3 bg-white hover:bg-gray-50 text-indigo-600 rounded-md font-medium border border-indigo-200 flex items-center justify-center gap-2"
      >
        Sign In
      </motion.a>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Lock className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Saya</h1>
            </div>
            
            <h2 className="text-5xl font-extrabold tracking-tighter text-gray-900 mb-6">
              Welcome to Saya
              <span className="text-indigo-600 block">Making Memories</span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Secure your precious memories with military-grade encryption. Easy to use, impossible to crack.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a 
                href="/auth/signUp"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium flex items-center justify-center gap-2 shadow-lg"
              >
                Sign Up
                <ChevronRight className="w-4 h-4" />
              </motion.a>
              
              {renderAuthButton()}
            </div>
          </motion.div>
        </div>
      </div>
      {/* Features Section */}
      <div className="py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Lock className="w-6 h-6" />,
                title: "End-to-End Encryption",
                description: "Your photos are encrypted before they leave your device, ensuring complete privacy.",
              },
              {
                icon: <Cloud className="w-6 h-6" />,
                title: "Secure Cloud Storage",
                description: "Automatic backups with encrypted cloud storage keep your memories safe.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Password Protection",
                description: "Each vault is protected with a unique password that only you know.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border-0"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 flex flex-col items-center text-center"
          >
            <Image className="w-16 h-16 text-indigo-600 mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Start Securing Your Photos Today
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl">
              Join thousands of users who trust Saya to keep their memories safe and private.
            </p>
            <motion.a 
              href="/auth/signUp"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium flex items-center justify-center gap-2 shadow-lg"
            >
              Create Your Account
              <ChevronRight className="w-4 h-4" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SayaLanding;