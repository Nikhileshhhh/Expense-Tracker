import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { 
  TrendingUp, Target, Bell, FileText, PieChart, Calendar, 
  Shield, Users, Download, Play, ChevronRight, Star,
  BarChart3, Wallet, CreditCard, Building, CheckCircle,
  ArrowRight, Zap, Heart, Award, Globe
} from 'lucide-react';
import LandingHeader from '../components/LandingHeader';
import { useRef } from 'react';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { duration: 0.7, delay: 0.12 }
};

// Counter animation hook
const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (inView && !hasStarted) {
      setHasStarted(true);
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [inView, end, duration, hasStarted]);

  return { count, ref };
};

// Check for reduced motion preference
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

const PublicLanding: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Disable animations if user prefers reduced motion
  const animationProps = prefersReducedMotion ? {} : fadeInUp;

  // Counter animations
  const downloadsCounter = useCountUp(10000);
  const transactionsCounter = useCountUp(100000);

  const features = [
    {
      icon: <PieChart className="h-8 w-8" />,
      title: "Budget Planner",
      description: "Create monthly budgets by category and see real-time spending vs budget."
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Smart Savings Goals",
      description: "Set goals, auto-track progress, and receive AI nudges to stay on track."
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: "Bill Reminders & Payments",
      description: "Never miss a due date. Add reminders, schedule payments and get notifications."
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "PDF Reports & Exports",
      description: "Generate polished PDF reports for monthly reviews or to share."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Connect or add accounts",
      description: "Securely add accounts or input data manually."
    },
    {
      number: "02",
      title: "Categorize & plan",
      description: "We auto-categorize spending and suggest budgets."
    },
    {
      number: "03",
      title: "Save & report",
      description: "Meet goals faster and generate monthly PDF reports."
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "College Student",
      content: "SmartPay helped me track my hostel expenses and save for my laptop. The budget alerts are super helpful!",
      avatar: "PS"
    },
    {
      name: "Rahul Patel",
      role: "Working Professional",
      content: "The PDF reports feature is amazing for tax filing. Clean interface and great for managing multiple accounts.",
      avatar: "RP"
    },
    {
      name: "Anita Reddy",
      role: "Freelancer",
      content: "Bill reminders saved me from late fees multiple times. The savings goals feature keeps me motivated!",
      avatar: "AR"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="text-left"
              {...(prefersReducedMotion ? {} : fadeInLeft)}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                SmartPay — Take control of your money,{' '}
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  effortlessly.
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                All your budgets, bills, savings goals and reports in one secure dashboard. 
                Smart suggestions powered by AI to help you save more.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-8 text-gray-700">
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-2" />
                  Track spending
                </span>
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-2" />
                  Automate bills
                </span>
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-2" />
                  Set savings goals
                </span>
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-500 mr-2" />
                  Generate PDF reports
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Get Started — It's Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                <button
                  onClick={() => setShowDemo(true)}
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-200 text-blue-600 font-semibold rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  <Play className="mr-2 h-5 w-5" />
                  See Demo
                </button>
              </div>
            </motion.div>

            <motion.div 
              className="relative"
              {...(prefersReducedMotion ? {} : scaleIn)}
            >
              <div className="relative bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8 shadow-2xl transform hover:rotate-1 transition-transform duration-300">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Dashboard Overview</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Monthly Income</span>
                      <span className="text-lg font-bold text-green-600">₹45,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Monthly Expenses</span>
                      <span className="text-lg font-bold text-red-600">₹32,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Savings</span>
                      <span className="text-lg font-bold text-blue-600">₹13,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-600 to-teal-500 h-2 rounded-full w-3/4"></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">75% of savings goal achieved</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Metrics */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            {...(prefersReducedMotion ? {} : fadeInUp)}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by users & students</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="text-center"
              {...(prefersReducedMotion ? {} : { ...fadeInUp, transition: { delay: 0.1 } })}
            >
              <div ref={downloadsCounter.ref} className="text-4xl font-bold text-blue-600 mb-2">
                {downloadsCounter.count.toLocaleString()}+
              </div>
              <p className="text-gray-600">Downloads</p>
            </motion.div>
            <motion.div 
              className="text-center"
              {...(prefersReducedMotion ? {} : { ...fadeInUp, transition: { delay: 0.2 } })}
            >
              <div ref={transactionsCounter.ref} className="text-4xl font-bold text-teal-500 mb-2">
                {transactionsCounter.count.toLocaleString()}+
              </div>
              <p className="text-gray-600">Transactions processed</p>
            </motion.div>
            <motion.div 
              className="text-center"
              {...(prefersReducedMotion ? {} : { ...fadeInUp, transition: { delay: 0.3 } })}
            >
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-8 w-8 text-green-500 mr-2" />
                <span className="text-2xl font-bold text-green-500">Secure</span>
              </div>
              <p className="text-gray-600">Bank-level encryption</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...(prefersReducedMotion ? {} : fadeInUp)}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What SmartPay does</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your personal finances in one beautiful, intuitive platform
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0 },
                  transition: { duration: 0.6, delay: index * 0.12 },
                  viewport: { once: true }
                })}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...(prefersReducedMotion ? {} : fadeInUp)}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How SmartPay works</h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="relative text-center"
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0 },
                  transition: { duration: 0.6, delay: index * 0.15 },
                  viewport: { once: true }
                })}
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-teal-200 transform -translate-x-10"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...(prefersReducedMotion ? {} : fadeInUp)}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Inside the app</h2>
            <p className="text-xl text-gray-600">Explore the features that make financial management effortless</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Budget Dashboard", image: "📊", description: "Visual budget tracking" },
              { title: "Savings Progress", image: "🎯", description: "Goal achievement tracking" },
              { title: "Bill Calendar", image: "📅", description: "Never miss payments" },
              { title: "PDF Reports", image: "📄", description: "Professional summaries" }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, scale: 0.9 },
                  whileInView: { opacity: 1, scale: 1 },
                  transition: { duration: 0.5, delay: index * 0.1 },
                  viewport: { once: true }
                })}
              >
                <div className="h-48 bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center text-6xl">
                  {item.image}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PDF Reports Section */}
      <section className="py-20 bg-blue-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              {...(prefersReducedMotion ? {} : fadeInLeft)}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Professional PDF Reports</h2>
              <p className="text-xl text-gray-600 mb-8">
                Export monthly summaries and detailed transaction reports as downloadable PDFs. 
                Share with mentors, accountants, or keep for records.
              </p>
              <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200">
                <Download className="mr-2 h-5 w-5" />
                Generate Sample Report
              </button>
            </motion.div>
            <motion.div
              className="relative"
              {...(prefersReducedMotion ? {} : fadeInRight)}
            >
              <div className="bg-white rounded-xl shadow-2xl p-8 transform hover:rotate-1 transition-transform duration-300">
                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Financial Report</h3>
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Income</span>
                      <span className="font-semibold">₹45,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Expenses</span>
                      <span className="font-semibold">₹32,000</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="text-gray-900 font-semibold">Net Savings</span>
                      <span className="font-bold text-green-600">₹13,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Budgets Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="relative order-2 lg:order-1"
              {...(prefersReducedMotion ? {} : fadeInLeft)}
            >
              <div className="bg-white rounded-xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Budget Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Food & Groceries</span>
                    <span className="text-sm text-gray-500">₹8,000 / ₹10,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full w-4/5"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Transportation</span>
                    <span className="text-sm text-gray-500">₹4,500 / ₹5,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-yellow-500 h-3 rounded-full w-4/5"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Entertainment</span>
                    <span className="text-sm text-gray-500">₹3,200 / ₹3,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-red-500 h-3 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="order-1 lg:order-2"
              {...(prefersReducedMotion ? {} : fadeInRight)}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Plan your budgets</h2>
              <p className="text-xl text-gray-600 mb-8">
                Create flexible budgets per category (food, travel, rent). See remaining budget at a glance.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">On track</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Warning</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Over budget</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Savings Goals Section */}
      <section className="py-20 bg-teal-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              {...(prefersReducedMotion ? {} : fadeInLeft)}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Set & reach goals</h2>
              <p className="text-xl text-gray-600 mb-8">
                Visual progress bars and auto-tracking help you reach goals faster. 
                Create target amount, set deadlines, and let SmartPay track it.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-teal-500 mr-3" />
                  <span className="text-gray-700">Auto-tracking from your transactions</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-teal-500 mr-3" />
                  <span className="text-gray-700">Deadline reminders and motivation</span>
                </div>
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-teal-500 mr-3" />
                  <span className="text-gray-700">Visual progress tracking</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="relative"
              {...(prefersReducedMotion ? {} : fadeInRight)}
            >
              <div className="bg-white rounded-xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Emergency Fund</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Progress</span>
                    <span className="text-2xl font-bold text-teal-600">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-4 rounded-full w-3/4 relative">
                      <div className="absolute right-0 top-0 w-4 h-4 bg-white border-2 border-teal-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹37,500 saved</span>
                    <span>₹50,000 goal</span>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-teal-700">
                      <strong>Great progress!</strong> You're ₹12,500 away from your goal. 
                      At your current rate, you'll reach it in 2 months.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bill Reminders Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="relative order-2 lg:order-1"
              {...(prefersReducedMotion ? {} : fadeInLeft)}
            >
              <div className="bg-white rounded-xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Bills</h3>
                <div className="space-y-4">
                  {[
                    { name: "Electricity Bill", due: "Jan 15", amount: "₹2,500", status: "due" },
                    { name: "Internet", due: "Jan 18", amount: "₹1,200", status: "upcoming" },
                    { name: "Mobile Recharge", due: "Jan 22", amount: "₹399", status: "upcoming" }
                  ].map((bill, index) => (
                    <div key={bill.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          bill.status === 'due' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{bill.name}</p>
                          <p className="text-sm text-gray-600">Due: {bill.due}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">{bill.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div
              className="order-1 lg:order-2"
              {...(prefersReducedMotion ? {} : fadeInRight)}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Never miss a bill</h2>
              <p className="text-xl text-gray-600 mb-8">
                Calendar reminders, due date warnings, and one-click mark as paid. 
                Notifications and email reminders keep you on track.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">Smart notifications before due dates</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">Calendar integration and reminders</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">One-click payment tracking</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...(prefersReducedMotion ? {} : fadeInUp)}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Students & Early Adopters</h2>
            <p className="text-xl text-gray-600">
              Built by students and tested by early adopters. Trusted for learning and personal finance management.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="bg-white rounded-xl p-8 shadow-lg"
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0 },
                  transition: { duration: 0.6, delay: index * 0.1 },
                  viewport: { once: true }
                })}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            {...(prefersReducedMotion ? {} : fadeInUp)}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600 mb-12">Start free, upgrade when you need more</p>
            
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Forever</h3>
                <div className="text-5xl font-bold text-blue-600 mb-2">₹0</div>
                <p className="text-gray-600">Perfect for students and individuals</p>
              </div>
              
              <div className="space-y-4 mb-8">
                {[
                  "Unlimited transactions",
                  "Budget tracking",
                  "Savings goals",
                  "Bill reminders",
                  "PDF reports",
                  "Multi-bank support",
                  "AI-powered insights"
                ].map((feature, index) => (
                  <div key={feature} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <a
                href="/signup"
                className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...(prefersReducedMotion ? {} : fadeInUp)}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </motion.div>
          
          <div className="space-y-6">
            {[
              {
                question: "Is SmartPay really free?",
                answer: "Yes! SmartPay is completely free to use. All features including budgets, savings goals, bill reminders, and PDF reports are available at no cost."
              },
              {
                question: "How secure is my financial data?",
                answer: "We use bank-level encryption and never store sensitive information like account numbers or passwords. Your data is stored securely in Firebase with industry-standard security measures."
              },
              {
                question: "Can I use SmartPay with multiple bank accounts?",
                answer: "Absolutely! You can add multiple bank accounts and track them separately. Each account has its own budgets, transactions, and reports."
              },
              {
                question: "Do you support Indian banks and currencies?",
                answer: "Yes! SmartPay is designed specifically for Indian users with support for major Indian banks, INR currency, and local bill types like electricity, water, and mobile recharge."
              },
              {
                question: "Can I export my data?",
                answer: "Yes, you can export your data as JSON backup files or generate professional PDF reports for any time period. Perfect for tax filing or sharing with accountants."
              }
            ].map((faq, index) => (
              <motion.div
                key={faq.question}
                className="bg-white rounded-xl p-6 shadow-sm"
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  transition: { duration: 0.5, delay: index * 0.1 },
                  viewport: { once: true }
                })}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            {...(prefersReducedMotion ? {} : fadeInUp)}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built by students, for everyone</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              SmartPay was created as a college project by passionate students who wanted to make personal finance management accessible and intuitive for everyone.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Nikhilesh Kamalapurkar", role: "Lead Developer", avatar: "NK" },
              { name: "Chintam Ashwanth Varma", role: "Frontend Developer", avatar: "CA" },
              { name: "Jadav Gajanand", role: "Backend Developer", avatar: "JG" },
              { name: "Abdul Gafoor", role: "UI/UX Designer", avatar: "AG" }
            ].map((member, index) => (
              <motion.div
                key={member.name}
                className="text-center"
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, scale: 0.9 },
                  whileInView: { opacity: 1, scale: 1 },
                  transition: { duration: 0.5, delay: index * 0.1 },
                  viewport: { once: true }
                })}
              >
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                  {member.avatar}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-500 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            {...(prefersReducedMotion ? {} : fadeInUp)}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to take control of your finances?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who are already managing their money smarter with SmartPay.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Already have an account?
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">SmartPay</h3>
              <p className="text-gray-400 mb-4">Personal Finance, Smarter.</p>
              <p className="text-gray-400 text-sm">
                Built with ❤️ by students at IARE College, India. 
                Making personal finance accessible for everyone.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#reports" className="hover:text-white transition-colors">Reports</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#privacy" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SmartPay. All rights reserved. Built by students, for everyone.</p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">SmartPay Demo</h3>
              <button
                onClick={() => setShowDemo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
              <Play className="h-16 w-16 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-6">
              Watch how SmartPay helps you manage your finances with ease. 
              See the dashboard, budgets, savings goals, and report generation in action.
            </p>
            <div className="flex gap-4">
              <a
                href="/signup"
                className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 rounded-lg text-center font-semibold hover:shadow-lg transition-all duration-200"
              >
                Try It Now
              </a>
              <button
                onClick={() => setShowDemo(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:border-gray-300 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicLanding;