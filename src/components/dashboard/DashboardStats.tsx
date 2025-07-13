import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, AlertTriangle } from 'lucide-react';
import { FinancialSummary } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface DashboardStatsProps {
  summary: FinancialSummary;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ summary }) => {
  const stats = [
    {
      title: 'Total Income',
      value: summary.totalIncome,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-900',
      borderColor: 'border-green-700'
    },
    {
      title: 'Total Expenses',
      value: summary.totalExpenses,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-900',
      borderColor: 'border-red-700'
    },
    {
      title: 'Overall Savings',
      value: summary.savings,
      icon: Wallet,
      color: summary.savings >= 0 ? 'text-blue-400' : 'text-red-400',
      bgColor: summary.savings >= 0 ? 'bg-blue-900' : 'bg-red-900',
      borderColor: summary.savings >= 0 ? 'border-blue-700' : 'border-red-700'
    },
    {
      title: 'Savings Rate',
      value: `${summary.savingsRate.toFixed(1)}%`,
      icon: Target,
      color: summary.savingsRate >= 20 ? 'text-green-400' : summary.savingsRate >= 10 ? 'text-yellow-400' : 'text-red-400',
      bgColor: summary.savingsRate >= 20 ? 'bg-green-900' : summary.savingsRate >= 10 ? 'bg-yellow-900' : 'bg-red-900',
      borderColor: summary.savingsRate >= 20 ? 'border-green-700' : summary.savingsRate >= 10 ? 'border-yellow-700' : 'border-red-700',
      isPercentage: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.isPercentage ? stat.value : formatCurrency(typeof stat.value === 'number' ? stat.value : 0)}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-full bg-gray-800`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            
            {/* Progress indicator for savings rate */}
            {stat.title === 'Savings Rate' && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Goal: 20%</span>
                  <span>{typeof stat.value === 'string' ? stat.value : '0%'}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      summary.savingsRate >= 20 ? 'bg-green-500' : 
                      summary.savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(summary.savingsRate, 0), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;