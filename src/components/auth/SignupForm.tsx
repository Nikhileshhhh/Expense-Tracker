import React, { useState } from 'react';
import { sendSignInLinkToEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { Mail, Chrome } from 'lucide-react';
import logo from '../../assets/logo.png';

const actionCodeSettings = {
  url: 'http://localhost:5173/verify',
  handleCodeInApp: true,
};

interface SignupFormProps {
  onSwitchToLogin?: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('✅ Verification link sent! Check your email.');
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-up was cancelled. If you wish to continue, please try again.');
      } else {
        setError(`❌ ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 border border-gray-700 min-w-[400px] w-full">
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="ExpenseTracker Logo" className="w-32 h-20 mb-2" />
      </div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-gray-400">Sign up to start tracking your finances</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
          <p className="text-green-200 text-sm">{message}</p>
        </div>
      )}

      <form onSubmit={handleSendLink} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-3 rounded-lg hover:from-red-700 hover:to-red-900 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? 'Sending Link...' : 'Send Verification Link'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
          </div>
        </div>
        <button
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="mt-4 w-full flex items-center justify-center space-x-3 bg-white text-gray-900 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Chrome className="h-5 w-5" />
          <span>{isLoading ? 'Signing Up...' : 'Sign up with Google'}</span>
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-400">
          Already have an account?{' '}
          {onSwitchToLogin && (
            <button
              onClick={onSwitchToLogin}
              className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200"
            >
              Sign in here
            </button>
          )}
        </p>
      </div>
    </div>
  );
};

export default SignupForm;