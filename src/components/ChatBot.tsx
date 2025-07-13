import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatCurrency, calculateFinancialSummaryWithAccount } from '../utils/calculations';
import { getCategoryName } from '../utils/categories';
import { getBankById } from '../utils/banks';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'analysis' | 'recommendation' | 'warning';
}

const ChatBot: React.FC = () => {
  const { user } = useAuth();
  const { incomes, expenses, budgets, savingsGoals, bankAccounts, selectedBankAccount } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzedData, setHasAnalyzedData] = useState(false);
  const [awaitingRecommendationElaboration, setAwaitingRecommendationElaboration] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with personalized welcome message
  useEffect(() => {
    if (user && !hasAnalyzedData) {
      const welcomeMessage: Message = {
        id: '1',
        text: `Hello ${user.displayName || user.email || 'User'}! 👋 I'm your personal financial assistant for ExpenseTracker. I can analyze your spending patterns, help with budgeting, and provide personalized financial advice based on your actual data from ${bankAccounts.length} bank accounts. How can I help you today?`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setHasAnalyzedData(true);
    }
  }, [user, hasAnalyzedData, bankAccounts.length]);

  // Analyze user's financial data
  const analyzeUserData = () => {
    // Filter data by selected bank account (same as Dashboard)
    const filteredIncomes = selectedBankAccount 
      ? incomes.filter(income => income.bankAccountId === selectedBankAccount.id)
      : incomes;
    
    const filteredExpenses = selectedBankAccount 
      ? expenses.filter(expense => expense.bankAccountId === selectedBankAccount.id)
      : expenses;
    
    const summary = calculateFinancialSummaryWithAccount(filteredIncomes, filteredExpenses, budgets, selectedBankAccount);
    
    const analysis = {
      totalTransactions: filteredIncomes.length + filteredExpenses.length,
      topExpenseCategory: getTopExpenseCategory(filteredExpenses),
      budgetStatus: getBudgetStatus(filteredExpenses),
      savingsGoalProgress: getSavingsGoalProgress(filteredIncomes, filteredExpenses),
      financialHealth: getFinancialHealthScore(summary),
      recommendations: getPersonalizedRecommendations(summary, filteredIncomes, filteredExpenses),
      bankAccountInfo: getBankAccountInfo()
    };

    return analysis;
  };

  const getBankAccountInfo = () => {
    if (bankAccounts.length === 0) return null;
    
    const totalBalance = bankAccounts.reduce((sum, account) => sum + account.currentBalance, 0);
    const activeAccount = selectedBankAccount;
    
    return {
      totalAccounts: bankAccounts.length,
      totalBalance,
      activeAccount: activeAccount ? {
        name: activeAccount.nickname || getBankById(activeAccount.bankName)?.name,
        balance: activeAccount.currentBalance,
        bank: getBankById(activeAccount.bankName)?.name
      } : null
    };
  };

  const getTopExpenseCategory = (expenses: any[]) => {
    const categoryTotals: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    return topCategory ? {
      category: getCategoryName(topCategory[0]),
      amount: topCategory[1]
    } : null;
  };

  const getBudgetStatus = (expenses: any[]) => {
    if (budgets.length === 0) return null;
    
    const overBudgetCategories = budgets.filter(budget => {
      const spent = expenses
        .filter(expense => expense.category === budget.category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      return spent > budget.budgetAmount;
    });

    return {
      totalBudgets: budgets.length,
      overBudget: overBudgetCategories.length,
      categories: overBudgetCategories.map(budget => getCategoryName(budget.category))
    };
  };

  const getSavingsGoalProgress = (incomes: any[], expenses: any[]) => {
    if (savingsGoals.length === 0) return null;

    const summary = calculateFinancialSummaryWithAccount(incomes, expenses, budgets, selectedBankAccount);
    const totalSavings = summary.savings;

    return {
      totalGoals: savingsGoals.length,
      totalTargetAmount: savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0),
      currentSavings: totalSavings,
      achievableGoals: savingsGoals.filter(goal => totalSavings >= goal.targetAmount).length
    };
  };

  const getFinancialHealthScore = (summary: any) => {
    let score = 0;
    const factors = [];

    // Savings rate (40% of score)
    if (summary.savingsRate >= 20) {
      score += 40;
      factors.push("Excellent savings rate");
    } else if (summary.savingsRate >= 10) {
      score += 25;
      factors.push("Good savings rate");
    } else if (summary.savingsRate >= 0) {
      score += 10;
      factors.push("Positive savings");
    } else {
      factors.push("Negative savings - spending more than earning");
    }

    // Budget adherence (30% of score)
    const budgetStatus = getBudgetStatus(expenses);
    if (budgetStatus) {
      if (budgetStatus.overBudget === 0) {
        score += 30;
        factors.push("Staying within all budgets");
      } else if (budgetStatus.overBudget <= budgetStatus.totalBudgets * 0.3) {
        score += 20;
        factors.push("Mostly within budget limits");
      } else {
        score += 5;
        factors.push("Exceeding multiple budgets");
      }
    }

    // Goal progress (20% of score)
    const goalProgress = getSavingsGoalProgress(incomes, expenses);
    if (goalProgress) {
      const progressRate = goalProgress.achievableGoals / goalProgress.totalGoals;
      if (progressRate >= 0.8) {
        score += 20;
        factors.push("On track with savings goals");
      } else if (progressRate >= 0.5) {
        score += 15;
        factors.push("Making progress on goals");
      } else {
        score += 5;
        factors.push("Behind on savings goals");
      }
    }

    // Transaction tracking (10% of score)
    if (incomes.length > 0 && expenses.length > 0) {
      score += 10;
      factors.push("Actively tracking finances");
    }

    return { score, factors };
  };

  const getPersonalizedRecommendations = (summary: any, filteredIncomes: any[], filteredExpenses: any[]) => {
    const recommendations = [];
    const topCategory = getTopExpenseCategory(filteredExpenses);
    const budgetStatus = getBudgetStatus(filteredExpenses);
    const bankInfo = getBankAccountInfo();

    // Bank account recommendations
    if (bankInfo && bankInfo.totalAccounts === 1) {
      recommendations.push({
        type: 'banking',
        priority: 'medium',
        message: `Consider adding a separate savings account to better organize your finances. You currently have ${formatCurrency(bankInfo.totalBalance)} in one account.`
      });
    }

    // Savings rate recommendations
    if (summary.savingsRate < 0) {
      recommendations.push({
        type: 'savings',
        priority: 'high',
        message: `You're spending more than you earn. Focus on reducing ${topCategory?.category || 'discretionary'} expenses immediately to achieve positive savings.`
      });
    } else if (summary.savingsRate < 10) {
      recommendations.push({
        type: 'savings',
        priority: 'medium',
        message: `Your savings rate of ${summary.savingsRate.toFixed(1)}% is below the recommended 20%. Consider reducing ${topCategory?.category || 'non-essential'} spending.`
      });
    }

    // Budget recommendations
    if (budgetStatus && budgetStatus.overBudget > 0) {
      recommendations.push({
        type: 'budget',
        priority: 'high',
        message: `You're over budget in ${budgetStatus.overBudget} categories: ${budgetStatus.categories.join(', ')}. Review and adjust your spending in these areas.`
      });
    }

    // Goal recommendations
    const goalProgress = getSavingsGoalProgress(filteredIncomes, filteredExpenses);
    if (goalProgress && goalProgress.achievableGoals < goalProgress.totalGoals) {
      recommendations.push({
        type: 'goals',
        priority: 'medium',
        message: `You're on track to achieve ${goalProgress.achievableGoals}/${goalProgress.totalGoals} savings goals. Consider increasing your savings rate or extending goal timelines.`
      });
    }

    return recommendations;
  };

  // Generate contextual responses based on user data
  const generatePersonalizedResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    const analysis = analyzeUserData();
    
    // Filter data by selected bank account (same as Dashboard)
    const filteredIncomes = selectedBankAccount 
      ? incomes.filter(income => income.bankAccountId === selectedBankAccount.id)
      : incomes;
    
    const filteredExpenses = selectedBankAccount 
      ? expenses.filter(expense => expense.bankAccountId === selectedBankAccount.id)
      : expenses;
    
    const summary = calculateFinancialSummaryWithAccount(filteredIncomes, filteredExpenses, budgets, selectedBankAccount);
    const bankInfo = analysis.bankAccountInfo;

    // About section questions
    if (lowerQuestion.includes('about') || lowerQuestion.includes('what is') || lowerQuestion.includes('tell me about') || lowerQuestion.includes('who made') || lowerQuestion.includes('developer') || lowerQuestion.includes('who developed')) {
      if (lowerQuestion.includes('developer') || lowerQuestion.includes('who made') || lowerQuestion.includes('creator') || lowerQuestion.includes('who developed')) {
        return `👨‍💻 About the Developer:

Nikhilesh Kamalapurkar
• B.Tech in Artificial Intelligence & Machine Learning
• 2nd Year, IV Semester at IARE College, India
• LinkedIn: linkedin.com/in/nikhilesh-kamalapurkar-497ba02b7
• Email: kamalapurkarnikhilesh@gmail.com

Developer's Vision: "I'm an enthusiastic, detail-oriented developer passionate about crafting modern, user-focused software. Currently pursuing B.Tech at IARE in AI & ML, I'm eager to solve real-world problems with technology. Developing this project was driven by a vision to make personal finance simpler, more visual, and easier to understand for everyone."

This ExpenseTracker was built to make personal finance management accessible and intuitive for everyone! 🌟`;
      }

      if (lowerQuestion.includes('feature') || lowerQuestion.includes('what can') || lowerQuestion.includes('capabilities')) {
        return `🌟 Key Features of ExpenseTracker:

📊 Dashboard: Quick overview of financial health with pie charts, donut charts, and bar graphs showing spending distribution and trends.

💰 Budgets: Set monthly/yearly spending limits by category with live progress tracking and color-coded alerts (green/yellow/red).

💳 Expenses: Record, edit, delete expenses with category-based donut charts for visual breakdown.

💵 Incomes: Track multiple income streams (salary, side hustles, freelance) with visual charts.

🏦 Savings Goals: Plan targets with progress indicators and graphical motivation.

🏛️ Bank Accounts: Manage multiple accounts with balance tracking and line graphs.

🔔 Bill Reminders: Manage Indian bills (electricity, water, tax, insurance, fees) with notifications.

🎨 Themes: Three beautiful themes (Modern Red, Dark Blue, Clean White) for personalization.

📈 Data Visualization: Donut charts, bar graphs, and progress bars for easy analysis.

🤖 AI Chatbot: Powered by Google Gemini API for 24/7 financial assistance.

🔐 Google Sign-In: Secure one-tap authentication with Gmail accounts.

⚙️ Settings: Profile management, notifications, data export, and security options.

This comprehensive platform makes managing your finances straightforward and insightful! 💪`;
      }

      if (lowerQuestion.includes('purpose') || lowerQuestion.includes('why') || lowerQuestion.includes('goal of')) {
        return `🎯 Purpose & Mission:

ExpenseTracker & Financial Dashboard was created to empower individuals to take control of their personal finances through:

📈 Better Financial Awareness: Visual dashboards and charts help you understand where your money goes.

🎯 Goal Achievement: Set and track savings goals with progress indicators and motivation.

💰 Smart Budgeting: Live budget tracking with alerts to prevent overspending.

🔔 Proactive Management: Bill reminders and notifications keep you on top of payments.

📊 Data-Driven Insights: AI-powered analysis provides personalized recommendations.

🎨 User Experience: Beautiful, intuitive interface that makes finance management enjoyable.

The platform is designed especially for:
• Students learning to manage their finances
• Families wanting better financial organization
• Anyone seeking to improve their financial health
• Users who prefer visual, data-driven approaches

Our mission is to make personal finance management accessible, enjoyable, and effective for everyone! 💪`;
      }

      return `🌟 About ExpenseTracker:

ExpenseTracker & Financial Dashboard is an advanced personal finance platform that empowers you to manage, track, and optimize your spending and savings. Built with a modern, intuitive interface, this website makes managing your money straightforward and insightful.

Key Highlights:
• 📊 Comprehensive financial dashboard with visual analytics
• 💰 Smart budgeting with live progress tracking
• 🎯 Goal-setting and progress monitoring
• 🔔 Bill reminders and notifications
• 🤖 AI-powered financial assistant (that's me!)
• 🎨 Beautiful, customizable themes
• 🔐 Secure Google Sign-In authentication

The platform was developed by Nikhilesh Kamalapurkar, a B.Tech AI & ML student at IARE College, with the vision of making personal finance simpler and more visual for everyone.

📧 Contact: kamalapurkarnikhilesh@gmail.com
🔗 LinkedIn: linkedin.com/in/nikhilesh-kamalapurkar-497ba02b7

What would you like to know more about - features, developer, or how to use specific sections? 😊`;
    }

    // Bank account questions
    if (lowerQuestion.includes('bank') || lowerQuestion.includes('account')) {
      if (!bankInfo) {
        return `You haven't added any bank accounts yet! Add your first bank account to start tracking your finances across different accounts. This helps you organize your money better and see where each transaction comes from.`;
      }
      
      return `Bank Account Overview:
• Total Accounts: ${bankInfo.totalAccounts}
• Combined Balance: ${formatCurrency(bankInfo.totalBalance)}
${bankInfo.activeAccount ? `• Active Account: ${bankInfo.activeAccount.name} (${formatCurrency(bankInfo.activeAccount.balance)})` : ''}

${bankInfo.totalAccounts === 1 ? 'Consider adding a savings account to separate your emergency fund from daily expenses!' : 'Great job organizing your finances across multiple accounts!'}`;
    }

    // Data analysis requests
    if (lowerQuestion.includes('analyze') || lowerQuestion.includes('analysis') || lowerQuestion.includes('overview')) {
      return `📊 Your Financial Analysis:

Income & Expenses:
• Total Income: ${formatCurrency(summary.totalIncome)}
• Total Expenses: ${formatCurrency(summary.totalExpenses)}
• Net Savings: ${formatCurrency(summary.savings)}
• Savings Rate: ${summary.savingsRate.toFixed(1)}%

Financial Health Score: ${analysis.financialHealth.score}/100
${analysis.financialHealth.factors.map(factor => `• ${factor}`).join('\n')}

Key Insights:
${analysis.topExpenseCategory ? `• Highest spending: ${analysis.topExpenseCategory.category} (${formatCurrency(analysis.topExpenseCategory.amount)})` : '• No expense data available'}
${analysis.budgetStatus ? `• Budget status: ${analysis.budgetStatus.overBudget}/${analysis.budgetStatus.totalBudgets} categories over budget` : '• No budgets set'}
${analysis.savingsGoalProgress ? `• Goals progress: ${analysis.savingsGoalProgress.achievableGoals}/${analysis.savingsGoalProgress.totalGoals} goals achievable` : '• No savings goals set'}
${bankInfo ? `• Bank accounts: ${bankInfo.totalAccounts} accounts with ${formatCurrency(bankInfo.totalBalance)} total balance` : '• No bank accounts added'}`;
    }

    // Budget-related questions
    if (lowerQuestion.includes('budget')) {
      if (budgets.length === 0) {
        return `💡 You haven't set any budgets yet! Based on your expenses of ${formatCurrency(summary.totalExpenses)}, I recommend starting with the 50/30/20 rule. Would you like me to suggest specific budget amounts for your top spending categories?`;
      }
      
      const budgetStatus = getBudgetStatus(filteredExpenses);
      if (budgetStatus && budgetStatus.overBudget > 0) {
        return `⚠️ You're currently over budget in ${budgetStatus.overBudget} categories: ${budgetStatus.categories.join(', ')}. Your total monthly expenses are ${formatCurrency(summary.totalExpenses)}. Consider reducing spending in these areas or adjusting your budget limits.`;
      }
      
      return `✅ Great job! You're staying within your budget limits. Your current savings rate is ${summary.savingsRate.toFixed(1)}%. Consider increasing your savings goals if possible.`;
    }

    // Savings questions
    if (lowerQuestion.includes('save') || lowerQuestion.includes('saving')) {
      const goalProgress = getSavingsGoalProgress(filteredIncomes, filteredExpenses);
      if (summary.savingsRate < 0) {
        return `🚨 You're currently spending more than you earn (${formatCurrency(Math.abs(summary.savings))} deficit). Priority: reduce expenses in ${analysis.topExpenseCategory?.category || 'your highest spending areas'} immediately.`;
      }
      
      if (summary.savingsRate < 10) {
        return `📈 Your current savings rate is ${summary.savingsRate.toFixed(1)}%. To reach the recommended 20%, you need to save an additional ${formatCurrency((summary.totalIncome * 0.2) - summary.savings)} monthly. Start by reducing ${analysis.topExpenseCategory?.category || 'discretionary'} spending.`;
      }
      
      return `🎯 Excellent! You're saving ${summary.savingsRate.toFixed(1)}% of your income (${formatCurrency(summary.savings)}/month). ${goalProgress ? `You're on track to achieve ${goalProgress.achievableGoals}/${goalProgress.totalGoals} of your savings goals.` : 'Consider setting specific savings goals to stay motivated!'}`;
    }

    // Expense questions
    if (lowerQuestion.includes('expense') || lowerQuestion.includes('spending')) {
      if (!analysis.topExpenseCategory) {
        return `📝 Start tracking your expenses to get personalized insights! Add your daily expenses using the "Add Expense" button to see where your money goes.`;
      }
      
      return `💰 Your spending analysis:
• Total monthly expenses: ${formatCurrency(summary.totalExpenses)}
• Highest category: ${analysis.topExpenseCategory.category} (${formatCurrency(analysis.topExpenseCategory.amount)})
• This represents ${((analysis.topExpenseCategory.amount / summary.totalExpenses) * 100).toFixed(1)}% of your total spending

💡 Tip: Focus on optimizing your ${analysis.topExpenseCategory.category} expenses first for maximum impact.`;
    }

    // Goal questions
    if (lowerQuestion.includes('goal') || lowerQuestion.includes('target')) {
      const goalProgress = getSavingsGoalProgress(filteredIncomes, filteredExpenses);
      if (!goalProgress) {
        return `🎯 You haven't set any savings goals yet! With your current savings of ${formatCurrency(summary.savings)}/month, you could achieve significant financial milestones. Consider setting goals for emergency fund, vacation, or major purchases.`;
      }
      
      return `🎯 Your savings goals progress:
• Total goals: ${goalProgress.totalGoals}
• Target amount: ${formatCurrency(goalProgress.totalTargetAmount)}
• Current monthly savings: ${formatCurrency(goalProgress.currentSavings)}
• Achievable goals: ${goalProgress.achievableGoals}/${goalProgress.totalGoals}

${goalProgress.achievableGoals < goalProgress.totalGoals ? '💡 To reach more goals faster, consider increasing your savings rate or extending goal timelines.' : '🎉 Great progress! You\'re on track to achieve your financial goals.'}`;
    }

    // Recommendations
    if (lowerQuestion.includes('recommend') || lowerQuestion.includes('advice') || lowerQuestion.includes('suggest')) {
      const recommendations = analysis.recommendations.slice(0, 3);
      setAwaitingRecommendationElaboration(true);
      if (recommendations.length === 0) {
        return `🌟 You're doing great! Your finances look healthy. Keep tracking your expenses and consider setting new savings goals to continue growing your wealth.`;
      }
      return `💡 Personalized Recommendations:

${recommendations.map((rec, index) => `${index + 1}. ${rec.message}`).join('\n\n')}

Would you like me to elaborate on any of these recommendations or help you implement them?`;
    }

    // Focus/Priority questions
    if (lowerQuestion.includes('focus') || lowerQuestion.includes('priority') || lowerQuestion.includes('what should i focus on') || lowerQuestion.includes('what should i prioritize')) {
      const recommendations = analysis.recommendations.slice(0, 3);
      const topCategory = getTopExpenseCategory(filteredExpenses);
      const budgetStatus = getBudgetStatus(filteredExpenses);
      
      if (summary.savingsRate < 0) {
        return `🚨 IMMEDIATE PRIORITY: You're spending more than you earn. Focus on:
1. Reducing ${topCategory?.category || 'discretionary'} expenses immediately
2. Creating a strict budget for essential expenses only
3. Finding additional income sources if possible

Your current deficit: ${formatCurrency(Math.abs(summary.savings))}/month`;
      }
      
      if (summary.savingsRate < 10) {
        return `📈 PRIORITY: Increase your savings rate from ${summary.savingsRate.toFixed(1)}% to 20%. Focus on:
1. Reducing ${topCategory?.category || 'non-essential'} spending
2. ${budgetStatus?.overBudget ? `Getting back within budget for: ${budgetStatus.categories.join(', ')}` : 'Staying within your budget limits'}
3. Setting up automatic savings transfers

Additional savings needed: ${formatCurrency((summary.totalIncome * 0.2) - summary.savings)}/month`;
      }
      
      return `🎯 You're doing great! Your savings rate of ${summary.savingsRate.toFixed(1)}% is excellent. Consider:
1. Setting more ambitious savings goals
2. Investing your savings for better returns
3. Helping others improve their financial habits

Keep up the excellent work! 💪`;
    }

    // Default response with user context
    return `I'm here to help with your ExpenseTracker data! I can analyze your ${incomes.length} income sources, ${expenses.length} expenses, ${budgets.length} budgets, ${savingsGoals.length} savings goals, and ${bankAccounts.length} bank accounts. 

Try asking me:
• "Analyze my finances"
• "How are my budgets doing?"
• "Give me savings advice"
• "What should I focus on?"
• "Show my spending patterns"
• "How are my bank accounts?"
• "Tell me about the app features"
• "Who developed this app?"

What would you like to know about your financial situation or the app?`;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Generate personalized response based on user's financial data
      const response = generatePersonalizedResponse(currentInput);
      
      // Determine message type based on content
      let messageType: 'analysis' | 'recommendation' | 'warning' | undefined;
      if (response.includes('🚨') || response.includes('⚠️')) {
        messageType = 'warning';
      } else if (response.includes('💡') || response.includes('📈')) {
        messageType = 'recommendation';
      } else if (response.includes('📊') || response.includes('Analysis')) {
        messageType = 'analysis';
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        type: messageType
      };

      setMessages(prev => [...prev, botMessage]);

      // Try to enhance with AI if API key is available
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey && apiKey !== 'your-gemini-api-key-here') {
        try {
          const enhancedResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Based on this financial data analysis: "${response}", provide additional personalized insights or tips in 2-3 sentences. Focus on actionable advice for the user's specific situation. User question was: "${currentInput}"`
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 100,
              }
            })
          });

          if (enhancedResponse.ok) {
            const data = await enhancedResponse.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const enhancedMessage: Message = {
                id: (Date.now() + 2).toString(),
                text: `🤖 AI Enhancement: ${data.candidates[0].content.parts[0].text}`,
                sender: 'bot',
                timestamp: new Date(),
                type: 'recommendation'
              };
              setMessages(prev => [...prev, enhancedMessage]);
            }
          }
        } catch (aiError) {
          // Silently fail AI enhancement - user already got the personalized response
          console.log('AI enhancement failed, but personalized response was provided');
        }
      }

      if (awaitingRecommendationElaboration && ['yes', 'y', 'sure', 'okay', 'ok', 'please do', 'elaborate'].includes(inputText.trim().toLowerCase())) {
        setAwaitingRecommendationElaboration(false);
        const analysis = analyzeUserData();
        const recommendations = analysis.recommendations;
        if (recommendations.length === 0) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: 'You have no critical recommendations at this time. Keep up the good work!',
            sender: 'bot',
            timestamp: new Date(),
            type: 'recommendation'
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
          return;
        }
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Here are more details on your recommendations:\n\n${recommendations.map((rec, i) => `${i+1}. ${rec.message}`).join('\n\n')}`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'recommendation'
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        return;
      }

    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I encountered an error. However, I can still help you with your ExpenseTracker data! Try asking me about your budgets, expenses, or savings goals.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'analysis':
        return <TrendingUp className="h-4 w-4 text-blue-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />;
      case 'recommendation':
        return <Bot className="h-4 w-4 text-green-400 flex-shrink-0" />;
      default:
        return <Bot className="h-4 w-4 text-red-400 flex-shrink-0" />;
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 ${
          isOpen ? 'hidden' : 'block'
        }`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col max-w-[calc(100vw-2rem)]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-red-600 to-red-800 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-white" />
              <div>
                <h3 className="font-semibold text-white">Financial Assistant</h3>
                <p className="text-xs text-red-100">Analyzing your ExpenseTracker data</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-300 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[calc(100%-1rem)] px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-red-600 text-white'
                      : message.type === 'warning'
                      ? 'bg-red-900 border border-red-700 text-red-100'
                      : message.type === 'analysis'
                      ? 'bg-blue-900 border border-blue-700 text-blue-100'
                      : message.type === 'recommendation'
                      ? 'bg-green-900 border border-green-700 text-green-100'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === 'bot' && getMessageIcon(message.type)}
                    {message.sender === 'user' && (
                      <User className="h-4 w-4 mt-0.5 text-white flex-shrink-0" />
                    )}
                    <span className="whitespace-pre-line">{message.text}</span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-200 px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-red-400" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-gray-700">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setInputText('Analyze my finances')}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors duration-200"
              >
                📊 Analyze
              </button>
              <button
                onClick={() => setInputText('How are my budgets?')}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors duration-200"
              >
                💰 Budgets
              </button>
              <button
                onClick={() => setInputText('Give me recommendations')}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors duration-200"
              >
                💡 Tips
              </button>
              <button
                onClick={() => setInputText('Tell me about the app features')}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors duration-200"
              >
                🌟 About
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your finances..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputText.trim()}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;