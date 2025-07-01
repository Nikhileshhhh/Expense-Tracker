import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { isSignInWithEmailLink, signInWithEmailLink, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createUserDocument } from '../utils/createUserDocument';

const Verify: React.FC = () => {
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<'verifying' | 'setup' | 'done'>('verifying');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '' });

  useEffect(() => {
    const checkLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('signupEmail') || '';
        if (!email) {
          email = window.prompt('Please enter your email for verification') || '';
        }
        setEmail(email);
        setIsLoading(true);
        try {
          await signInWithEmailLink(auth, email, window.location.href);
          setStage('setup');
        } catch (err: any) {
          setError(err.message || 'Verification failed.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setError('Invalid or expired verification link.');
      }
    };
    checkLink();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setIsLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
      await updateProfile(userCredential.user, { displayName: formData.name });
      await createUserDocument(userCredential.user, formData.name);
      setStage('done');
      window.localStorage.removeItem('signupEmail');
      setTimeout(() => window.location.replace('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setIsLoading(false);
    }
  };

  if (stage === 'verifying') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Verifying Email...</h2>
          {isLoading && <p className="text-gray-300">Please wait...</p>}
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  if (stage === 'setup') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Complete Your Registration</h2>
          {error && <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-200">{error}</div>}
          <form onSubmit={handleSetup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Create a password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Confirm your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-3 rounded-lg hover:from-red-700 hover:to-red-900 transition-all duration-200 font-medium disabled:opacity-50"
            >
              {isLoading ? 'Completing...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-4">Registration Complete!</h2>
          <p className="text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Verify; 