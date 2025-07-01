import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define available themes
export type Theme = 'dark' | 'light' | 'vibrant';

// Theme configuration interface
export interface ThemeConfig {
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  classes: {
    body: string;
    container: string;
    card: string;
    button: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    heading: string;
    label: string;
  };
}

// Theme configurations
export const themes: Record<Theme, ThemeConfig> = {
  dark: {
    name: 'Dark Mode',
    description: 'Classic dark theme with elegant contrast',
    preview: {
      primary: '#1F2937',
      secondary: '#374151',
      accent: '#EF4444',
      background: '#111827',
      text: '#F9FAFB'
    },
    classes: {
      body: 'bg-gray-900 text-white',
      container: 'bg-gray-800',
      card: 'bg-gray-800 border-gray-700',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      textMuted: 'text-gray-400',
      heading: 'text-white',
      label: 'text-gray-300'
    }
  },
  light: {
    name: 'Light Mode',
    description: 'Clean and minimal light theme',
    preview: {
      primary: '#F3F4F6',
      secondary: '#E5E7EB',
      accent: '#EF4444',
      background: '#FFFFFF',
      text: '#111827'
    },
    classes: {
      body: 'bg-gray-50 text-gray-900',
      container: 'bg-white',
      card: 'bg-white border-gray-200 shadow-sm',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      text: 'text-white',
      textSecondary: 'text-gray-200',
      textMuted: 'text-gray-300',
      heading: 'text-white',
      label: 'text-gray-200'
    }
  },
  vibrant: {
    name: 'Modern Vibrant',
    description: 'Bright colors with playful typography',
    preview: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#F59E0B',
      background: '#FEF3C7',
      text: '#1F2937'
    },
    classes: {
      body: 'bg-gradient-to-br from-yellow-100 via-purple-50 to-indigo-100 text-gray-900',
      container: 'bg-white/80 backdrop-blur-sm',
      card: 'bg-white/90 backdrop-blur-sm border-purple-200 shadow-lg',
      button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold',
      text: 'text-white',
      textSecondary: 'text-gray-200',
      textMuted: 'text-gray-300',
      heading: 'text-white',
      label: 'text-gray-200'
    }
  }
};

// Theme context interface
interface ThemeContextType {
  currentTheme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
  showThemeSelector: boolean;
  setShowThemeSelector: (show: boolean) => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Get theme configuration for current theme
  const themeConfig = themes[currentTheme];

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('user_theme') as Theme;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Apply theme to document body
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-dark', 'theme-light', 'theme-vibrant');
    
    // Add current theme class
    root.classList.add(`theme-${currentTheme}`);
    
    // Apply theme-specific styles
    Object.entries(themeConfig.preview).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [currentTheme, themeConfig]);

  // Set theme function
  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('user_theme', theme);
  };

  const value: ThemeContextType = {
    currentTheme,
    themeConfig,
    setTheme,
    showThemeSelector,
    setShowThemeSelector
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 