import React, { ReactNode } from 'react';
import { Home, TrendingUp, PieChart, Target, Settings, LogOut, Menu, X, BarChart3, FileText, Building, Bell, AlertTriangle, CheckCircle, Palette, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBillReminders } from '../contexts/BillReminderContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import Footer from './Footer';
import logo from '../assets/logo.png';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { user, logout, refreshKey } = useAuth();
  const { getDueReminders, markAsPaid, deleteReminder } = useBillReminders();
  const { budgets, budgetProgress, savingsGoals, expenses, getBudgetNotifications } = useData();
  const { currentTheme, setTheme, themeConfig } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dueReminders = getDueReminders();

  // Theme cycling function
  const cycleTheme = () => {
    const themes: Array<'dark' | 'light' | 'vibrant'> = ['dark', 'light', 'vibrant'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Budget notifications with bank account information
  const { overBudget: overBudgetData, alertBudgets: alertBudgetsData } = getBudgetNotifications();

  // Goal notifications
  const overdueGoals = savingsGoals.filter(g => {
    const daysLeft = (new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const achieved = g.currentAmount >= g.targetAmount;
    return daysLeft < 0 && !achieved;
  });

  const totalNotifications = dueReminders.length + overBudgetData.length + alertBudgetsData.length + overdueGoals.length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: TrendingUp },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'bank-accounts', label: 'Bank Accounts', icon: Building },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'about', label: 'About', icon: Info },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen ${themeConfig.classes.body}`}>
      {/* Mobile Header */}
      <div className={`lg:hidden ${themeConfig.classes.container} shadow-sm border-b border-gray-700`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="ExpenseTracker Logo" className="w-8 h-8" />
            <h1 className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>ExpenseTracker</h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              className={`p-2 rounded-md transition-colors duration-200 ${
                currentTheme === 'dark' 
                  ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-700'
                  : 'text-black hover:text-purple-600 hover:bg-gray-200'
              }`}
              title={`Current theme: ${currentTheme}. Click to cycle themes.`}
            >
              <Palette className="h-6 w-6" />
            </button>
            {/* Notification Bell */}
            <div className="relative">
              {/* Overlay to block interaction with main content when dropdown is open */}
              {showDropdown && (
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowDropdown(false)}
                />
              )}
              <button
                className={`relative focus:outline-none transition-colors duration-200
                  ${currentTheme === 'vibrant' ? 'bg-white bg-opacity-80 border border-yellow-400 shadow-md' : ''}
                  rounded-full p-1.5
                `}
                onClick={() => setShowDropdown((v) => !v)}
                aria-label="Notifications"
              >
                <Bell className={`h-6 w-6 transition-colors
                  ${currentTheme === 'dark'
                    ? 'text-gray-300 hover:text-red-400'
                    : currentTheme === 'vibrant'
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-black hover:text-red-600'}
                `} />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-pulse">
                    {totalNotifications}
                  </span>
                )}
              </button>
              {/* Mobile Notification Dropdown */}
              {showDropdown && (
                <div className={`absolute right-0 mt-2 w-72 sm:w-80 z-50 p-4 max-h-96 overflow-y-auto max-w-[calc(100vw-2rem)]
                  ${currentTheme === 'vibrant'
                    ? 'bg-white bg-opacity-95 border border-yellow-400 shadow-2xl rounded-xl'
                    : `${themeConfig.classes.container} border border-gray-700 rounded-xl shadow-lg`}
                `}>
                  <h3 className={`font-semibold mb-2 text-base ${themeConfig.classes.text}`}>Notifications</h3>
                  {/* Bill Reminders */}
                  <div className="mb-4">
                    <div className="flex items-center mb-1 text-red-400 font-semibold"><Bell className="h-4 w-4 mr-1" /> Bill Reminders</div>
                    {dueReminders.length === 0 ? (
                      <p className={`text-xs mb-2 ${themeConfig.classes.textMuted}`}>No due or overdue bill reminders.</p>
                    ) : (
                      <div className="space-y-2">
                        {dueReminders.map(rem => (
                          <div key={rem.id} className={`flex items-center justify-between ${themeConfig.classes.card} rounded-lg p-3 border border-gray-600 min-w-0`}>
                            <div className="flex-1 min-w-0 mr-2">
                              <p className={`font-medium text-sm ${themeConfig.classes.text} truncate`}>{rem.billName}</p>
                              <p className={`text-xs ${themeConfig.classes.textMuted}`}>Due: {rem.dueDate}</p>
                              {rem.notes && <p className={`text-xs ${themeConfig.classes.textMuted} italic truncate`}>{rem.notes}</p>}
                            </div>
                            <div className="flex flex-col space-y-1 flex-shrink-0">
                              <button onClick={() => markAsPaid(rem.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">Mark as Paid</button>
                              <button onClick={() => deleteReminder(rem.id)} className="bg-gray-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Budget Alerts */}
                  <div className="mb-4">
                    <div className="flex items-center mb-1 text-yellow-400 font-semibold">
                      <AlertTriangle className="h-4 w-4 mr-1" /> 
                      <span 
                        className="cursor-pointer hover:text-yellow-300 transition-colors"
                        onClick={() => {
                          onPageChange('budgets');
                          setShowDropdown(false);
                        }}
                      >
                        Budget Alerts
                      </span>
                    </div>
                    {overBudgetData.length === 0 && alertBudgetsData.length === 0 ? (
                      <p className={`text-xs mb-2 ${themeConfig.classes.textMuted}`}>No budget alerts.</p>
                    ) : (
                      <div className="space-y-2">
                        {overBudgetData.map(({ budget, bankAccount, progress }) => (
                          <div 
                            key={budget.id} 
                            className="flex items-center justify-between bg-red-900 border border-red-700 rounded-lg p-3 cursor-pointer hover:bg-red-800 transition-colors min-w-0"
                            onClick={() => {
                              onPageChange('budgets');
                              setShowDropdown(false);
                            }}
                          >
                            <div className="flex items-center flex-1 min-w-0 mr-2">
                              <Target className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className={`text-sm font-medium ${themeConfig.classes.text} block truncate`}>{budget.category}</span>
                                <p className={`text-xs ${themeConfig.classes.textMuted} truncate`}>
                                  {bankAccount.bankName}
                                  {bankAccount.nickname && bankAccount.nickname !== bankAccount.bankName && (
                                    <span className="text-gray-500"> ({bankAccount.nickname})</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="text-red-400 text-xs font-bold flex-shrink-0">Over Budget! ({progress.toFixed(0)}%)</span>
                          </div>
                        ))}
                        {alertBudgetsData.map(({ budget, bankAccount, progress }) => (
                          <div 
                            key={budget.id} 
                            className="flex items-center justify-between bg-yellow-900 border border-yellow-700 rounded-lg p-3 cursor-pointer hover:bg-yellow-800 transition-colors min-w-0"
                            onClick={() => {
                              onPageChange('budgets');
                              setShowDropdown(false);
                            }}
                          >
                            <div className="flex items-center flex-1 min-w-0 mr-2">
                              <Target className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className={`text-sm font-medium ${themeConfig.classes.text} block truncate`}>{budget.category}</span>
                                <p className={`text-xs ${themeConfig.classes.textMuted} truncate`}>
                                  {bankAccount.bankName}
                                  {bankAccount.nickname && bankAccount.nickname !== bankAccount.bankName && (
                                    <span className="text-gray-500"> ({bankAccount.nickname})</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="text-yellow-400 text-xs font-bold flex-shrink-0">{progress.toFixed(0)}% used</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Goal Deadlines */}
                  <div>
                    <div className="flex items-center mb-1 text-blue-400 font-semibold">
                      <TrendingUp className="h-4 w-4 mr-1" /> 
                      <span 
                        className="cursor-pointer hover:text-blue-300 transition-colors"
                        onClick={() => {
                          onPageChange('goals');
                          setShowDropdown(false);
                        }}
                      >
                        Goal Deadlines
                      </span>
                    </div>
                    {overdueGoals.length === 0 ? (
                      <p className={`text-xs mb-2 ${themeConfig.classes.textMuted}`}>No overdue goals.</p>
                    ) : (
                      <div className="space-y-2">
                        {overdueGoals.map(g => {
                          const daysOverdue = Math.abs(Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                          return (
                            <div 
                              key={g.id} 
                              className="flex items-center justify-between bg-blue-900 border border-blue-700 rounded-lg p-3 cursor-pointer hover:bg-blue-800 transition-colors"
                              onClick={() => {
                                onPageChange('goals');
                                setShowDropdown(false);
                              }}
                            >
                              <div className="flex items-center"><CheckCircle className="h-4 w-4 text-blue-400 mr-2" /><span className={`text-sm font-medium ${themeConfig.classes.text}`}>{g.title}</span></div>
                              <span className="text-blue-400 text-xs font-bold">Overdue by {daysOverdue} days</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`flex w-full`}>
        {/* Sidebar */}
        {(isSidebarOpen || isMobileMenuOpen) && (
          <div className={
            `
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
              ${isSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
              fixed lg:static inset-y-0 left-0 z-50 w-64 ${themeConfig.classes.container} shadow-lg transform transition-transform duration-300 ease-in-out lg:shadow-none lg:border-r border-gray-700
            `
          }>
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="hidden lg:flex items-center space-x-3 p-6 border-b border-gray-700">
                <img src={logo} alt="ExpenseTracker Logo" className="w-12 h-12" />
                <div>
                  <h1 className={`text-xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>ExpenseTracker</h1>
                </div>
              </div>

              {/* User Info */}
              <div className="p-6 border-b border-gray-700 lg:border-b-0" key={`user-info-${refreshKey}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-semibold">
                    {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>
                      {user?.displayName || user?.email || 'User'}
                    </p>
                    <p className={`text-xs ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onPageChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                        currentPage === item.id
                          ? 'bg-red-900 text-red-100 border-r-2 border-red-500'
                          : currentTheme === 'dark' 
                          ? 'text-white hover:text-gray-200 hover:bg-gray-700'
                          : 'text-black hover:text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={async () => {
                    try {
                      await logout();
                    } catch (error) {
                      console.error('Error logging out:', error);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    currentTheme === 'dark' 
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className={`w-full ${themeConfig.classes.body} flex flex-col min-h-screen transition-all duration-300`}>
          {/* Top Navbar (desktop only) */}
          <div className="hidden lg:flex justify-between items-center px-6 pt-6 pb-2">
            <button
              className="p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700 mr-4"
              onClick={() => setIsSidebarOpen((v) => !v)}
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex-1 flex justify-end items-center space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={cycleTheme}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  currentTheme === 'dark' 
                    ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-700'
                    : 'text-black hover:text-purple-600 hover:bg-gray-200'
                }`}
                title={`Current theme: ${currentTheme}. Click to cycle themes.`}
              >
                <Palette className="h-6 w-6" />
              </button>
              
              <div className="relative">
                {/* Overlay to block interaction with main content when dropdown is open */}
                {showDropdown && (
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowDropdown(false)}
                  />
                )}
                <button
                  className={`relative focus:outline-none transition-colors duration-200
                    ${currentTheme === 'vibrant' ? 'bg-white bg-opacity-80 border border-yellow-400 shadow-md' : ''}
                    rounded-full p-1.5
                  `}
                  onClick={() => setShowDropdown((v) => !v)}
                  aria-label="Notifications"
                >
                  <Bell className={`h-6 w-6 transition-colors
                    ${currentTheme === 'dark'
                      ? 'text-gray-300 hover:text-red-400'
                      : currentTheme === 'vibrant'
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-black hover:text-red-600'}
                  `} />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold animate-pulse">
                      {totalNotifications}
                    </span>
                  )}
                </button>
                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-80 sm:w-96 z-50 p-4 max-w-[calc(100vw-2rem)]
                    ${currentTheme === 'vibrant'
                      ? 'bg-white bg-opacity-95 border border-yellow-400 shadow-2xl rounded-xl'
                      : `${themeConfig.classes.container} border border-gray-700 rounded-xl shadow-lg`}
                  `}>
                    <h3 className={`font-semibold mb-2 text-base ${themeConfig.classes.text}`}>Notifications</h3>
                    {/* Bill Reminders */}
                    <div className="mb-4">
                      <div className="flex items-center mb-1 text-red-400 font-semibold"><Bell className="h-4 w-4 mr-1" /> Bill Reminders</div>
                      {dueReminders.length === 0 ? (
                        <p className={`text-xs mb-2 ${themeConfig.classes.textMuted}`}>No due or overdue bill reminders.</p>
                      ) : (
                        <div className="space-y-2">
                          {dueReminders.map(rem => (
                            <div key={rem.id} className={`flex items-center justify-between ${themeConfig.classes.card} rounded-lg p-3 border border-gray-600 min-w-0`}>
                              <div className="flex-1 min-w-0 mr-2">
                                <p className={`font-medium text-sm ${themeConfig.classes.text} truncate`}>{rem.billName}</p>
                                <p className={`text-xs ${themeConfig.classes.textMuted}`}>Due: {rem.dueDate}</p>
                                {rem.notes && <p className={`text-xs ${themeConfig.classes.textMuted} italic truncate`}>{rem.notes}</p>}
                              </div>
                              <div className="flex flex-col space-y-1 flex-shrink-0">
                                <button onClick={() => markAsPaid(rem.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">Mark as Paid</button>
                                <button onClick={() => deleteReminder(rem.id)} className="bg-gray-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Budget Alerts */}
                    <div className="mb-4">
                      <div className="flex items-center mb-1 text-yellow-400 font-semibold">
                        <AlertTriangle className="h-4 w-4 mr-1" /> 
                        <span 
                          className="cursor-pointer hover:text-yellow-300 transition-colors"
                          onClick={() => {
                            onPageChange('budgets');
                            setShowDropdown(false);
                          }}
                        >
                          Budget Alerts
                        </span>
                      </div>
                      {overBudgetData.length === 0 && alertBudgetsData.length === 0 ? (
                        <p className={`text-xs mb-2 ${themeConfig.classes.textMuted}`}>No budget alerts.</p>
                      ) : (
                        <div className="space-y-2">
                          {overBudgetData.map(({ budget, bankAccount, progress }) => (
                            <div 
                              key={budget.id} 
                              className="flex items-center justify-between bg-red-900 border border-red-700 rounded-lg p-3 cursor-pointer hover:bg-red-800 transition-colors min-w-0"
                              onClick={() => {
                                onPageChange('budgets');
                                setShowDropdown(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0 mr-2">
                                <Target className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className={`text-sm font-medium ${themeConfig.classes.text} block truncate`}>{budget.category}</span>
                                  <p className={`text-xs ${themeConfig.classes.textMuted} truncate`}>
                                    {bankAccount.bankName}
                                    {bankAccount.nickname && bankAccount.nickname !== bankAccount.bankName && (
                                      <span className="text-gray-500"> ({bankAccount.nickname})</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <span className="text-red-400 text-xs font-bold flex-shrink-0">Over Budget! ({progress.toFixed(0)}%)</span>
                            </div>
                          ))}
                          {alertBudgetsData.map(({ budget, bankAccount, progress }) => (
                            <div 
                              key={budget.id} 
                              className="flex items-center justify-between bg-yellow-900 border border-yellow-700 rounded-lg p-3 cursor-pointer hover:bg-yellow-800 transition-colors min-w-0"
                              onClick={() => {
                                onPageChange('budgets');
                                setShowDropdown(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0 mr-2">
                                <Target className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                                <div className="min-w-0">
                                  <span className={`text-sm font-medium ${themeConfig.classes.text} block truncate`}>{budget.category}</span>
                                  <p className={`text-xs ${themeConfig.classes.textMuted} truncate`}>
                                    {bankAccount.bankName}
                                    {bankAccount.nickname && bankAccount.nickname !== bankAccount.bankName && (
                                      <span className="text-gray-500"> ({bankAccount.nickname})</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <span className="text-yellow-400 text-xs font-bold flex-shrink-0">{progress.toFixed(0)}% used</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Goal Deadlines */}
                    <div>
                      <div className="flex items-center mb-1 text-blue-400 font-semibold">
                        <TrendingUp className="h-4 w-4 mr-1" /> 
                        <span 
                          className="cursor-pointer hover:text-blue-300 transition-colors"
                          onClick={() => {
                            onPageChange('goals');
                            setShowDropdown(false);
                          }}
                        >
                          Goal Deadlines
                        </span>
                      </div>
                      {overdueGoals.length === 0 ? (
                        <p className={`text-xs mb-2 ${themeConfig.classes.textMuted}`}>No overdue goals.</p>
                      ) : (
                        <div className="space-y-2">
                          {overdueGoals.map(g => {
                            const daysOverdue = Math.abs(Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                            return (
                              <div 
                                key={g.id} 
                                className="flex items-center justify-between bg-blue-900 border border-blue-700 rounded-lg p-3 cursor-pointer hover:bg-blue-800 transition-colors"
                                onClick={() => {
                                  onPageChange('goals');
                                  setShowDropdown(false);
                                }}
                              >
                                <div className="flex items-center"><CheckCircle className="h-4 w-4 text-blue-400 mr-2" /><span className={`text-sm font-medium ${themeConfig.classes.text}`}>{g.title}</span></div>
                                <span className="text-blue-400 text-xs font-bold">Overdue by {daysOverdue} days</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main content area - flex-grow to push footer down */}
          <main className="flex-grow p-6">
            {children}
          </main>
          
          {/* Footer - now stays at bottom */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;