import React from 'react';
import { TrendingUp, Target, CreditCard, DollarSign, PiggyBank, Building, Bell, Palette, BarChart3, Settings, User, GraduationCap, Linkedin, Bot, Shield, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const About: React.FC = () => {
  const { currentTheme } = useTheme();

  const features = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Dashboard",
      description: "Gives you a quick overview of your financial health. Shows your incomes, expenses, budgets, savings goals, and upcoming bills. Uses pie charts and donut charts to visualize spending distribution among categories. Uses bar graphs to show month-to-month income and expenses so you can spot trends easily."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Budgets",
      description: "Set limits for spending by category (monthly or yearly). Track live progress against your budget. Visual budget progress bars with color-coded alerts (green, yellow, red) to show whether you're on track, nearing your limit, or exceeding it."
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Expenses",
      description: "Record, edit, and delete expenses. Categorize them for detailed analytics. See expense breakdowns visually through category-based donut charts."
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Incomes",
      description: "Log income streams. Track salary, side hustles, freelance projects, etc. Visual charts show your income sources."
    },
    {
      icon: <PiggyBank className="h-6 w-6" />,
      title: "Savings Goals",
      description: "Plan targets (like buying a laptop, emergency funds, or travel). Progress is tracked with intuitive progress indicators. Graphical visuals motivate you to reach your savings goal."
    },
    {
      icon: <Building className="h-6 w-6" />,
      title: "Bank Accounts",
      description: "Manage multiple bank accounts. Track their balances in one place. See how your transactions affect your balances over time with line graphs."
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Bill Reminders",
      description: "Add and manage bill reminders for common Indian bills (electricity, water, land tax, insurance, school fees, etc.). Get notified before the due date. Visual indicators for paid/unpaid status."
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Themes",
      description: "After logging in, you can immediately pick from three beautifully designed themes to personalize the website: A Modern Red Theme, A Cool Dark Blue Theme, A Clean White Theme. This ensures you feel comfortable and motivated while managing finances."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Data Visualization",
      description: "Donut charts: show budget category spending in a visually appealing way. Bar graphs: compare income/expense trends over time. Progress bars: show budget utilization at a glance. This combination of charts makes it super easy to analyze and improve your financial habits."
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Settings",
      description: "Edit your profile, manage notifications, export data securely, clear data."
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI Chatbot",
      description: "Our platform features a powerful AI-driven chatbot, built using Google Gemini API. This conversational AI assistant helps you quickly answer questions about your finances, explains how to use the platform, provides insights on budgeting and saving, and supports you 24/7 with tips, best practices, and troubleshooting."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "🔐 Secure & Seamless User Authentication",
      description: "We've designed our app to make signing up and logging in as smooth as possible. You can choose to sign in using: Google Sign-In – Instantly access your account with your Gmail. Just one click, no extra passwords. Email & Password – Prefer the classic way? You can sign up or log in securely with your email credentials. Behind the scenes, we use Firebase Authentication to manage all user accounts, ensuring strong security and reliability. Your user data is safely stored in Cloud Firestore, which means your preferences, accounts, and activity are synced across all your devices in real-time. Whether you're tracking your finances from your laptop or phone, your data stays consistent, secure, and always up to date."
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className={`text-4xl font-bold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>
          🌟 About the Website
        </h1>
        <p className={`text-lg ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-4xl mx-auto leading-relaxed`}>
          ExpenseTracker & Financial Dashboard is an advanced personal finance platform that empowers you to manage, track, and optimize your spending and savings. Built with a modern, intuitive interface, this website makes managing your money straightforward and insightful.
        </p>
      </div>

      {/* Key Features Section */}
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>
          Key Features and Sections
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${currentTheme === 'dark' ? 'text-white' : 'text-white'}`}>
                    ✅ {feature.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${currentTheme === 'dark' ? 'text-gray-300' : 'text-white'}`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Section */}
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
        <h2 className={`text-2xl font-bold mb-6 ${currentTheme === 'dark' ? 'text-white' : 'text-white'}`}>
          👨‍💻 About the Developer
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-red-400" />
              <h3 className={`text-xl font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-white'}`}>
                Nikhilesh Kamalapurkar
              </h3>
            </div>
            
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-6 w-6 text-blue-400" />
              <div>
                <p className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-white'}`}>
                  B.Tech in Artificial Intelligence & Machine Learning
                </p>
                <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-white'}`}>
                  2nd Year, IV Semester
                </p>
                <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-white'}`}>
                  IARE College, India
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Linkedin className="h-6 w-6 text-blue-500" />
              <a
                href="https://www.linkedin.com/in/nikhilesh-kamalapurkar-497ba02b7/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200 underline"
              >
                linkedin.com/in/nikhilesh-kamalapurkar-497ba02b7
              </a>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-gray-400" />
              <a
                href="mailto:kamalapurkarnikhilesh@gmail.com"
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 underline"
              >
                kamalapurkarnikhilesh@gmail.com
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className={`text-lg font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-white'}`}>
              Developer's Vision
            </h4>
            <blockquote className={`italic text-lg leading-relaxed ${currentTheme === 'dark' ? 'text-gray-300' : 'text-white'} border-l-4 border-red-500 pl-4`}>
              "I'm an enthusiastic, detail-oriented developer passionate about crafting modern, user-focused software. Currently pursuing B.Tech at IARE in AI & ML, I'm eager to solve real-world problems with technology. Developing this project was driven by a vision to make personal finance simpler, more visual, and easier to understand for everyone. I love applying modern tools, frameworks, and data visualization to create meaningful user experiences."
            </blockquote>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="text-center bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className={`text-xl font-semibold mb-4 ${currentTheme === 'dark' ? 'text-white' : 'text-white'}`}>
          Connect with the Developer
        </h3>
        <p className={`mb-4 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-white'}`}>
          Have questions, suggestions, or want to collaborate?
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=kamalapurkarnikhilesh@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            <Mail className="h-5 w-5" />
            <span>Send Email</span>
          </a>

          <a
            href="https://www.linkedin.com/in/nikhilesh-kamalapurkar-497ba02b7/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            <Linkedin className="h-5 w-5" />
            <span>Connect on LinkedIn</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default About; 