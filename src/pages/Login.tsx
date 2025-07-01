import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import Footer from '../components/Footer';

const Login: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <div className="flex-1 flex items-center justify-center pb-16">
      <LoginForm onSwitchToSignup={() => window.location.href = '/signup'} />
    </div>
    <div className="fixed bottom-0 left-0 w-full z-50">
      <Footer />
    </div>
  </div>
);

export default Login; 