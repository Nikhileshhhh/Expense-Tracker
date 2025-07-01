import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Target, PieChart } from 'lucide-react';
import AddIncomeForm from './forms/AddIncomeForm';
import AddExpenseForm from './forms/AddExpenseForm';

interface QuickActionsProps {
  onSetBudget?: () => void;
  onViewReports?: () => void;
  onPageChange?: (page: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onSetBudget, onViewReports, onPageChange }) => {
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const actions = [
    {
      title: 'Add Income',
      description: 'Record new income source',
      icon: TrendingUp,
      color: 'from-green-600 to-green-800',
      hoverColor: 'from-green-700 to-green-900',
      onClick: () => setShowIncomeForm(true)
    },
    {
      title: 'Add Expense',
      description: 'Track new expense',
      icon: TrendingDown,
      color: 'from-red-600 to-red-800',
      hoverColor: 'from-red-700 to-red-900',
      onClick: () => setShowExpenseForm(true)
    },
    {
      title: 'Set Budget',
      description: 'Create spending limits',
      icon: Target,
      color: 'from-blue-600 to-blue-800',
      hoverColor: 'from-blue-700 to-blue-900',
      onClick: () => {
        if (onPageChange) {
          onPageChange('budgets');
        } else if (onSetBudget) {
          onSetBudget();
        } else {
          alert('Navigate to Budgets page to set budgets');
        }
      }
    },
    {
      title: 'View Reports',
      description: 'Analyze spending patterns',
      icon: PieChart,
      color: 'from-purple-600 to-purple-800',
      hoverColor: 'from-purple-700 to-purple-900',
      onClick: () => {
        if (onPageChange) {
          onPageChange('reports');
        } else if (onViewReports) {
          onViewReports();
        } else {
          alert('Navigate to Reports page to view detailed reports');
        }
      }
    }
  ];

  return (
    <>
      <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={action.onClick}
                className={`group relative overflow-hidden bg-gradient-to-r ${action.color} hover:${action.hoverColor} text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{action.title}</h3>
                    <p className="text-xs opacity-90">{action.description}</p>
                  </div>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              </button>
            );
          })}
        </div>
      </div>

      <AddIncomeForm 
        isOpen={showIncomeForm} 
        onClose={() => setShowIncomeForm(false)} 
      />
      
      <AddExpenseForm 
        isOpen={showExpenseForm} 
        onClose={() => setShowExpenseForm(false)} 
      />
    </>
  );
};

export default QuickActions;