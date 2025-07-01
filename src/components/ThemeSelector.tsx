import React, { useState, useEffect } from 'react';
import { Check, Palette, Sun, Moon, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme, themes, Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface ThemeSelectorProps {
  onComplete: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { currentTheme, setTheme, setShowThemeSelector } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<Theme>(currentTheme);
  const [isVisible, setIsVisible] = useState(false);

  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Theme icons mapping
  const themeIcons = {
    dark: Moon,
    light: Sun,
    vibrant: Sparkles
  };

  // Handle theme preview
  const handleThemePreview = (theme: Theme) => {
    setPreviewTheme(theme);
    // Temporarily apply theme for preview
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-vibrant');
    root.classList.add(`theme-${theme}`);
  };

  // Handle theme confirmation
  const handleConfirmTheme = () => {
    setTheme(previewTheme);
    setShowThemeSelector(false);
    
    // Animate out
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  // Handle skip (use current theme)
  const handleSkip = () => {
    setShowThemeSelector(false);
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Main Container */}
      <div className={`relative w-full max-w-4xl mx-4 p-8 rounded-3xl shadow-2xl transition-all duration-500 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      } ${themes[previewTheme].classes.container} border-2 border-opacity-20`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Palette className="h-8 w-8 text-purple-500 mr-3" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome, {user?.name || 'User'}!
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Choose your favorite theme to personalize your experience
          </p>
        </div>

        {/* Theme Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(themes).map(([themeKey, theme]) => {
            const Icon = themeIcons[themeKey as Theme];
            const isSelected = previewTheme === themeKey;
            
            return (
              <div
                key={themeKey}
                onClick={() => handleThemePreview(themeKey as Theme)}
                className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isSelected 
                    ? 'ring-4 ring-purple-500 ring-opacity-50 shadow-xl' 
                    : 'hover:shadow-lg'
                } ${theme.classes.card} border-2`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Theme preview */}
                <div className="mb-4">
                  <div 
                    className="w-full h-24 rounded-lg mb-3"
                    style={{ backgroundColor: theme.preview.background }}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: theme.preview.primary }}
                      />
                      <div 
                        className="w-16 h-3 rounded"
                        style={{ backgroundColor: theme.preview.secondary }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.preview.accent }}
                      />
                    </div>
                  </div>
                </div>

                {/* Theme info */}
                <div className="flex items-center mb-3">
                  <Icon className="h-5 w-5 mr-2 text-purple-500" />
                  <h3 className="font-semibold text-lg">{theme.name}</h3>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {theme.description}
                </p>

                {/* Color palette preview */}
                <div className="flex space-x-2 mt-4">
                  {Object.entries(theme.preview).map(([colorKey, color]) => (
                    <div
                      key={colorKey}
                      className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: color }}
                      title={colorKey}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors duration-200 font-medium"
          >
            Skip for now
          </button>
          
          <button
            onClick={handleConfirmTheme}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 ${themes[previewTheme].classes.button}`}
          >
            <span>Apply Theme</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Live Preview Note */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            💡 Click on any theme to see a live preview
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector; 