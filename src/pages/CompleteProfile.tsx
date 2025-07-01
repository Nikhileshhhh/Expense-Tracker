import React, { useState } from 'react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const CompleteProfile: React.FC = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setMessage('User not found.');
      return;
    }
    setIsLoading(true);
    try {
      await updateProfile(user, { displayName: name });
      await updatePassword(user, password);
      window.localStorage.removeItem('awaitingProfile');
      setMessage('Profile completed! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setMessage('Profile setup failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md mx-auto mt-16">
      <h2 className="text-2xl font-bold text-white mb-4">Set Your Profile</h2>
      <input
        placeholder="Full Name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full px-4 py-3 rounded bg-gray-700 text-white mb-4"
        required
      />
      <input
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
        className="w-full px-4 py-3 rounded bg-gray-700 text-white mb-4"
        required
      />
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-3 rounded-lg font-medium"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Continue'}
      </button>
      {message && <p className="mt-4 text-center text-sm text-green-300">{message}</p>}
    </form>
  );
};

export default CompleteProfile; 