import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { BillReminderProvider } from './contexts/BillReminderContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import Layout from './components/Layout';
import SlideshowBackground from './components/SlideshowBackground';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import BankAccounts from './pages/BankAccounts';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import About from './pages/About';
import Settings from './pages/Settings';
import ChatBot from './components/ChatBot';
import ThemeSelector from './components/ThemeSelector';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignupRequest from './pages/Signup';
import VerifyEmail from './pages/VerifySignup';
import CreatePassword from './pages/CreatePassword';
import Signup from './pages/Signup';
import CompleteProfile from './pages/CompleteProfile';
import Login from './pages/Login';

const AuthenticatedApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { showThemeSelector, setShowThemeSelector } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [hasShownThemeSelector, setHasShownThemeSelector] = useState(false);

  // Check if user has already chosen a theme
  useEffect(() => {
    if (user && !hasShownThemeSelector) {
      const savedTheme = localStorage.getItem('user_theme');
      const hasCompletedOnboarding = localStorage.getItem('user_onboarding_completed');
      
      // Show theme selector for new users who haven't completed onboarding
      if (!savedTheme || !hasCompletedOnboarding) {
        console.log('🎨 New user detected, showing theme selector');
        setShowThemeSelector(true);
      }
      setHasShownThemeSelector(true);
    }
  }, [user, hasShownThemeSelector, setShowThemeSelector]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        <SlideshowBackground />
        <div className="relative z-10 w-full max-w-md">
          <BrowserRouter>
            <Routes>
              <Route path="/signup" element={<SignupRequest />} />
              <Route path="/verify" element={<VerifyEmail />} />
              <Route path="/create-password" element={<CreatePassword />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/*" element={<Login />} />
            </Routes>
          </BrowserRouter>
        </div>
        <Footer />
      </div>
    );
  }

  // Show theme selector if needed
  if (showThemeSelector) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        <SlideshowBackground />
        <div className="relative z-10 w-full max-w-md">
          <ThemeSelector 
            onComplete={() => {
              setShowThemeSelector(false);
            }} 
          />
        </div>
        <Footer />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={setCurrentPage} />;
      case 'bank-accounts':
        return <BankAccounts />;
      case 'transactions':
        return <Transactions />;
      case 'budgets':
        return <Budgets />;
      case 'goals':
        return <Goals />;
      case 'reports':
        return <Reports />;
      case 'about':
        return <About />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onPageChange={setCurrentPage} />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderPage()}
      </Layout>
      <ChatBot />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BillReminderProvider>
            <ToastProvider>
              <AuthenticatedApp />
            </ToastProvider>
          </BillReminderProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;