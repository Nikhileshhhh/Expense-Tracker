import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Download, Trash2, Save, Plus, Palette, AlertTriangle, CheckCircle, Target, TrendingUp, Mail, Lock, Chrome, FileText } from 'lucide-react';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useBillReminders } from '../contexts/BillReminderContext';
import { useTheme, themes, Theme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { auth, db } from '../firebase';
import { exportFinancialReport, prepareFinancialReportData } from '../utils/exportFinancialReport';
import type { MonthlyData, CategoryData } from '../utils/exportFinancialReport';

const Settings: React.FC = () => {
  const { user, logout, isLoading, refreshUser, updateUserDocument, readUserDocument, setUser, isGoogleUser, isEmailPasswordUser } = useAuth();
  const { incomes, expenses, budgets, savingsGoals, budgetProgress, bankAccounts, deleteBankAccount, selectedBankAccount, getBudgetNotifications } = useData();
  const { reminders, addReminder, deleteReminder, markAsPaid, getDueReminders } = useBillReminders();
  const { currentTheme, setTheme, themeConfig } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.displayName || '',
    email: user?.email || ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    billReminders: true,
    goalDeadlines: true,
    monthlyReports: false
  });

  const billOptions = [
    'Electricity Bill', 'Water Bill', 'Internet', 'Mobile Recharge',
    'House Tax / Land Tax', 'Health Insurance Premium',
    'School/College Fees', 'EMI Payments', 'Gas Cylinder Booking'
  ];

  const [billForm, setBillForm] = useState({
    billName: '',
    dueDate: '',
    reminderTime: '1-day-before',
    notes: ''
  });

  const [showBillForm, setShowBillForm] = useState(false);

  // Get due reminders for notifications
  const dueReminders = getDueReminders();

  // Budget notifications with bank account information
  const { overBudget: overBudgetData, alertBudgets: alertBudgetsData } = getBudgetNotifications();

  // Goal notifications
  const overdueGoals = savingsGoals.filter(g => {
    const daysLeft = (new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const achieved = g.currentAmount >= g.targetAmount;
    return daysLeft < 0 && !achieved;
  });

  const totalNotifications = dueReminders.length + overBudgetData.length + alertBudgetsData.length + overdueGoals.length;

  const exportData = () => {
    const data = {
      incomes,
      expenses,
      budgets,
      savingsGoals,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const downloadPDFReport = async () => {
    if (!user) {
      showToast('Please log in to download the report.', 'error');
      return;
    }
    
    try {
      // Use the shared utility to prepare report data just like Reports page, passing selectedBankAccount
      const { bankAccountAnalysis, monthlyData, categoryData, accountCategoryBreakdowns } = prepareFinancialReportData({
        bankAccounts,
        incomes,
        expenses,
        selectedBankAccount,
        selectedYear: new Date().getFullYear()
      });
      // Prepare the data for exportFinancialReport
      const pdfBankAccounts = bankAccountAnalysis.map(analysis => ({
        bankName: analysis.account.bankName,
        nickname: analysis.account.nickname,
        startingBalance: analysis.initialBalance,
        totalIncome: analysis.totalIncome,
        totalExpense: analysis.totalExpense,
        currentBalance: analysis.currentBalance,
        createdAt: analysis.account.createdAt,
        monthlySavings: analysis.monthlySavings,
        savingsRate: analysis.savingsRate,
        transactionCount: analysis.transactionCount
      }));
          await exportFinancialReport(
      {
        displayName: user.displayName || undefined,
        email: user.email || ''
      },
      pdfBankAccounts,
      monthlyData,
      new Date().getFullYear(),
      undefined, // categoryData (already handled per-account)
      accountCategoryBreakdowns,
      budgets,
      savingsGoals,
      expenses
    );
      
      // Show success toast for all users
      showToast('PDF report downloaded successfully!', 'success');
    } catch (error) {
      showToast('Failed to download PDF report. Please try again.', 'error');
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      // Delete all bank accounts and their details
      for (const account of bankAccounts) {
        await deleteBankAccount(account.id);
      }
      localStorage.clear();
      alert('All data has been cleared. You will be logged out.');
      logout();
    }
  };

  const handleProfileSave = async () => {
    if (!auth.currentUser) {
      alert('No authenticated user found. Please log in again.');
      return;
    }
    
    if (!profileData.name.trim()) {
      alert('Please enter a valid name.');
      return;
    }

    const updatedName = profileData.name.trim();
    const updatedEmail = profileData.email.trim();
    
    console.log('🔄 Starting profile update for user:', auth.currentUser.uid);
    console.log('📝 New display name:', updatedName);
    console.log('📧 New email:', updatedEmail);
    console.log('🔍 User type:', isGoogleUser ? 'Google' : 'Email/Password');
    
    setIsUpdatingProfile(true);
    
    try {
      // 1. Update Firebase Authentication displayName
      console.log('🔐 Updating Firebase Auth display name...');
      await updateProfile(auth.currentUser, {
        displayName: updatedName
      });
      console.log('✅ Firebase Auth displayName updated successfully');
      
      // 2. Update email for email/password users only
      if (isEmailPasswordUser && updatedEmail !== user?.email) {
        console.log('📧 Updating email for email/password user...');
        await updateEmail(auth.currentUser, updatedEmail);
        console.log('✅ Firebase Auth email updated successfully');
      }
      
      // 3. Update Firestore document using the context function
      console.log('📄 Updating Firestore user document...');
      await updateUserDocument(updatedName);
      console.log('✅ Firestore document updated successfully');
      
      // 4. Force a complete refresh to ensure all components update
      console.log('🔄 Refreshing user state...');
      refreshUser();
      console.log('✅ User state refreshed');
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMessage.textContent = '✅ Profile updated successfully!';
      document.body.appendChild(successMessage);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log out and log back in before changing your email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      alert(errorMessage);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleBillReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) {
      alert('Please wait while we load your account information.');
      return;
    }

    if (!user || !user.uid) {
      alert('You must be logged in to add a bill reminder. Please refresh the page and try again.');
      return;
    }

    const { billName, dueDate } = billForm;
    if (!billName || !dueDate) {
      alert('Please select a bill and due date.');
      return;
    }

    const parsedDueDate = new Date(dueDate + 'T00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(parsedDueDate.getTime())) {
      alert('Invalid due date.');
      return;
    }

    if (parsedDueDate < today) {
      alert('Due date cannot be in the past.');
      return;
    }

    addReminder({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.uid,
      billName: billForm.billName,
      dueDate: billForm.dueDate,
      reminderTime: billForm.reminderTime as 'same-day' | '1-day-before' | '3-days-before',
      notes: billForm.notes,
      isPaid: false,
      createdAt: new Date().toISOString()
    });

    setBillForm({
      billName: '',
      dueDate: '',
      reminderTime: '1-day-before',
      notes: ''
    });
    setShowBillForm(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'bills', label: 'Bill Reminders', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Download },
    { id: 'theme', label: 'Theme', icon: Palette }
  ];

  // Sync profileData with current user
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.displayName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Settings</h1>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Customize your experience and manage your account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className={`${themeConfig.classes.container} rounded-xl shadow-sm border border-gray-700`}>
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-red-900 text-red-300 border-r-2 border-red-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className={`${themeConfig.classes.container} rounded-xl shadow-sm border border-gray-700 p-6`}>
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-semibold ${currentTheme === 'dark' ? themeConfig.classes.heading : 'text-black'}`}>Profile Information</h2>
                
                {/* User Type Indicator */}
                <div className={`p-3 rounded-lg border ${isGoogleUser ? 'bg-blue-900 border-blue-700' : 'bg-green-900 border-green-700'}`}>
                  <div className="flex items-center space-x-2">
                    {isGoogleUser ? (
                      <>
                        <Chrome className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-300 text-sm font-medium">Google Account</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 text-green-400" />
                        <span className="text-green-300 text-sm font-medium">Email/Password Account</span>
                      </>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isGoogleUser ? 'text-blue-400' : 'text-green-400'}`}>
                    {isGoogleUser 
                      ? 'Your profile is linked to your Google account. Email cannot be changed here.'
                      : 'You can update your name and email address.'
                    }
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${currentTheme === 'dark' ? themeConfig.classes.text : 'text-black'}`}>{user?.displayName || user?.email || 'User'}</h3>
                    <p className={currentTheme === 'dark' ? themeConfig.classes.textMuted : 'text-gray-600'}>{user?.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                      {isGoogleUser && <span className="text-gray-500 ml-1">(Google Account)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={isGoogleUser}
                        className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white ${
                          isGoogleUser ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                        placeholder="Enter your email address"
                      />
                      {isGoogleUser && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <Lock className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    {isGoogleUser && (
                      <p className="text-xs text-gray-500 mt-1">
                        Email is managed by your Google account and cannot be changed here.
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={handleProfileSave}
                  disabled={isUpdatingProfile || !profileData.name.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  <Save className="h-4 w-4" />
                  <span>{isUpdatingProfile ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Notifications</h2>
                  {totalNotifications > 0 && (
                    <span className="bg-red-600 text-white text-sm rounded-full px-3 py-1 font-bold">
                      {totalNotifications} active
                    </span>
                  )}
                </div>
                {/* Bill Reminders */}
                <div className="space-y-4">
                  <div className="flex items-center mb-3 text-red-400 font-semibold">
                    <Bell className="h-5 w-5 mr-2" />
                    Bill Reminders ({dueReminders.length})
                  </div>
                  {dueReminders.length === 0 ? (
                    <div className={`p-4 rounded-lg border ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                      <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No due or overdue bill reminders.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dueReminders.map(rem => (
                        <div key={rem.id} className={`flex items-center justify-between p-4 rounded-lg border ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                          <div>
                            <p className={`font-medium text-sm ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>{rem.billName}</p>
                            <p className={`text-xs ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Due: {rem.dueDate}</p>
                            {rem.notes && <p className={`text-xs ${currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} italic`}>{rem.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Budget Alerts */}
                <div className="space-y-4">
                  <div className="flex items-center mb-3 text-yellow-400 font-semibold">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Budget Alerts ({overBudgetData.length + alertBudgetsData.length})
                  </div>
                  {overBudgetData.length === 0 && alertBudgetsData.length === 0 ? (
                    <div className={`p-4 rounded-lg border ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                      <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No budget alerts.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overBudgetData.map(({ budget, bankAccount, progress }) => (
                        <div key={budget.id} className={`flex items-center justify-between p-4 rounded-lg border ${currentTheme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-300'}`}>
                          <div>
                            <Target className="h-4 w-4 text-red-400 mr-2" />
                            <span className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>{budget.category}</span>
                            <span className="ml-2 text-xs text-gray-500">({bankAccount.bankName}{bankAccount.nickname && bankAccount.nickname !== bankAccount.bankName ? `, ${bankAccount.nickname}` : ''})</span>
                          </div>
                          <span className="text-red-400 text-xs font-bold">Over Budget! ({progress.toFixed(0)}%)</span>
                        </div>
                      ))}
                      {alertBudgetsData.map(({ budget, bankAccount, progress }) => (
                        <div key={budget.id} className={`flex items-center justify-between p-4 rounded-lg border ${currentTheme === 'dark' ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-300'}`}>
                          <div>
                            <Target className="h-4 w-4 text-yellow-400 mr-2" />
                            <span className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>{budget.category}</span>
                            <span className="ml-2 text-xs text-gray-500">({bankAccount.bankName}{bankAccount.nickname && bankAccount.nickname !== bankAccount.bankName ? `, ${bankAccount.nickname}` : ''})</span>
                          </div>
                          <span className="text-yellow-400 text-xs font-bold">{progress.toFixed(0)}% used</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Goal Deadlines */}
                <div className="space-y-4">
                  <div className="flex items-center mb-3 text-blue-400 font-semibold">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Goal Deadlines ({overdueGoals.length})
                  </div>
                  {overdueGoals.length === 0 ? (
                    <div className={`p-4 rounded-lg border ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                      <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No overdue goals.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overdueGoals.map(g => {
                        const daysOverdue = Math.abs(Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                        return (
                          <div key={g.id} className={`flex items-center justify-between p-4 rounded-lg border ${currentTheme === 'dark' ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-300'}`}>
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                              <span className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>{g.title}</span>
                            </div>
                            <span className="text-blue-400 text-xs font-bold">Overdue by {daysOverdue} days</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'bills' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Bill Reminders</h2>
                  <button
                    onClick={() => setShowBillForm((prev) => !prev)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full flex items-center justify-center"
                    title="Add Bill Reminder"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {showBillForm && (
                  <form onSubmit={handleBillReminderSubmit} className="space-y-4 bg-gray-700 p-4 rounded-lg border border-gray-600">
                    {isLoading && (
                      <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3 mb-4">
                        <p className="text-yellow-300 text-sm">Loading your account information...</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bill Name *</label>
                        <select
                          value={billForm.billName}
                          onChange={(e) => setBillForm({ ...billForm, billName: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          required
                        >
                          <option value="">Select a bill</option>
                          {billOptions.map((bill) => (
                            <option key={bill} value={bill}>
                              {bill}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Due Date *</label>
                        <input
                          type="date"
                          value={billForm.dueDate}
                          onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Reminder Time</label>
                        <select
                          value={billForm.reminderTime}
                          onChange={(e) => setBillForm({ ...billForm, reminderTime: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        >
                          <option value="same-day">Same Day</option>
                          <option value="1-day-before">1 Day Before</option>
                          <option value="3-days-before">3 Days Before</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                        <input
                          type="text"
                          value={billForm.notes}
                          onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Loading...' : 'Add Reminder'}
                      </button>
                      <button type="button" onClick={() => setShowBillForm(false)} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-6">
                  <h3 className={`text-lg font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-black'} mb-4`}>Your Bill Reminders</h3>
                  {reminders.length === 0 ? (
                    <p className={currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>No bill reminders set.</p>
                  ) : (
                    <div className="space-y-3">
                      {reminders.map((rem) => (
                        <div key={rem.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${rem.isPaid ? 'bg-green-900 border-green-700' : 'bg-gray-700 border-gray-600'}`}>
                          <div>
                            <p className="font-medium text-white">{rem.billName}</p>
                            <p className="text-xs text-gray-400">Due: {rem.dueDate} | Reminder: {rem.reminderTime.replace('-', ' ')}</p>
                            {rem.notes && <p className="text-xs text-gray-500 italic">{rem.notes}</p>}
                          </div>
                          <div className="flex space-x-2">
                            {!rem.isPaid && (
                              <button onClick={() => markAsPaid(rem.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs">
                                Mark as Paid
                              </button>
                            )}
                            <button onClick={() => deleteReminder(rem.id)} className="bg-gray-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Data Management</h2>
                <div className="flex flex-wrap gap-4 mb-4">
                  <button
                    onClick={exportData}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                    style={{ minWidth: '150px' }}
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Data</span>
                  </button>
                  <button
                    onClick={downloadPDFReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                    style={{ minWidth: '150px' }}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
                <div className="p-4 border border-red-600 bg-red-900 rounded-lg">
                  <h3 className="font-medium text-red-300 mb-2">Danger Zone</h3>
                  <p className="text-sm text-red-400 mb-4">
                    Permanently delete all your data. This action cannot be undone.
                  </p>
                  <button
                    onClick={clearAllData}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete All Data</span>
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-semibold ${currentTheme === 'dark' ? themeConfig.classes.heading : 'text-black'}`}>Theme Settings</h2>
                <p className={currentTheme === 'dark' ? themeConfig.classes.textMuted : 'text-gray-600'}>Choose your preferred theme for the application</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(themes).map(([themeKey, themeConfigOption]) => (
                    <div
                      key={themeKey}
                      onClick={() => setTheme(themeKey as Theme)}
                      className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        currentTheme === themeKey 
                          ? 'border-purple-500 bg-purple-900/20' 
                          : 'border-gray-600 hover:border-gray-500 bg-gray-700'
                      }`}
                    >
                      {currentTheme === themeKey && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3 mb-3">
                        <div 
                          className="w-8 h-8 rounded-lg"
                          style={{ backgroundColor: themeConfigOption.preview.primary }}
                        />
                        <div>
                          <h3 className={`font-semibold ${currentTheme === 'dark' ? themeConfig.classes.text : 'text-black'}`}>{themeConfigOption.name}</h3>
                          <p className={`text-xs ${currentTheme === 'dark' ? themeConfig.classes.textMuted : 'text-gray-600'}`}>{themeConfigOption.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        {Object.entries(themeConfigOption.preview).map(([colorKey, color]) => (
                          <div
                            key={colorKey}
                            className="w-3 h-3 rounded-full border border-gray-600"
                            style={{ backgroundColor: color }}
                            title={colorKey}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={`mt-6 p-4 ${themeConfig.classes.card} rounded-lg`}>
                  <h4 className={`font-medium ${currentTheme === 'dark' ? themeConfig.classes.text : 'text-black'} mb-2`}>Current Theme: {themes[currentTheme].name}</h4>
                  <p className={`text-sm ${currentTheme === 'dark' ? themeConfig.classes.textMuted : 'text-gray-600'}`}>
                    Your theme preference is saved automatically and will be applied across all sessions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
