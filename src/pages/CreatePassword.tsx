import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const CreatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    const email = window.localStorage.getItem('pendingEmail');
    const displayName = window.localStorage.getItem('pendingDisplayName');
    if (!email) {
      setMessage('No email found. Please sign up again.');
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      window.localStorage.removeItem('pendingEmail');
      window.localStorage.removeItem('pendingDisplayName');
      setMessage('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setMessage('Failed to create account: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md mx-auto mt-16">
      <h2 className="text-2xl font-bold text-white mb-4">Set Password</h2>
      <input
        type="password"
        className="w-full px-4 py-3 rounded bg-gray-700 text-white mb-4"
        placeholder="Create a password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-3 rounded-lg font-medium"
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Set Password'}
      </button>
      {message && <p className="mt-4 text-center text-sm text-green-300">{message}</p>}
    </form>
  );
};

export default CreatePassword; 