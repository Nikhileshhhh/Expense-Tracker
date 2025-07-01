import React, { useEffect, useState } from 'react';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const [message, setMessage] = useState('Verifying...');
  const navigate = useNavigate();

  useEffect(() => {
    const email = window.localStorage.getItem('pendingEmail');
    if (!email) {
      setMessage('No email found. Please sign up again.');
      return;
    }
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setMessage('Email verified! Redirecting...');
      setTimeout(() => navigate('/create-password'), 1000);
    } else {
      setMessage('Invalid or expired verification link.');
    }
  }, [navigate]);

  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md mx-auto mt-16 text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Verify Email</h2>
      <p className="text-white">{message}</p>
    </div>
  );
};

export default VerifyEmail; 