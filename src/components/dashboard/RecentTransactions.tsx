import React from 'react';
import { Calendar, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Income, Expense } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { getCategoryName } from '../../utils/categories';
import { format, parseISO } from 'date-fns';

interface RecentTransactionsProps {
  incomes: Income[];
  expenses: Expense[];
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ incomes, expenses }) => {
  console.log('📋 RecentTransactions - Received incomes:', incomes.map(i => ({ id: i.id, amount: i.amount, description: i.description, source: i.source, date: i.date })));
  console.log('📋 RecentTransactions - Received expenses:', expenses.map(e => ({ id: e.id, amount: e.amount, description: e.description, category: e.category, date: e.date })));
  
  const transactions: Transaction[] = [
    ...incomes.map(income => {
      const description = income.description || income.source || 'Income';
      console.log('📋 Mapping income:', { id: income.id, amount: income.amount, description, source: income.source, hasDescription: !!income.description });
      return {
        id: income.id,
        type: 'income' as const,
        amount: income.amount,
        description,
        category: income.source,
        date: income.date
      };
    }),
    ...expenses.map(expense => {
      const description = expense.description || getCategoryName(expense.category);
      console.log('📋 Mapping expense:', { id: expense.id, amount: expense.amount, description, category: expense.category, hasDescription: !!expense.description });
      return {
        id: expense.id,
        type: 'expense' as const,
        amount: expense.amount,
        description,
        category: expense.category,
        date: expense.date
      };
    })
  ].filter(transaction => {
    const isValidDate = !isNaN(new Date(transaction.date).getTime());
    if (!isValidDate) {
      console.log('📋 Filtering out transaction with invalid date:', transaction);
    }
    return isValidDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  console.log('📋 RecentTransactions - Final transactions:', transactions.map(t => ({ id: t.id, type: t.type, amount: t.amount, description: t.description, date: t.date })));

  if (transactions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
        <div className="flex items-center justify-center h-40 text-gray-500">
          <div className="text-center">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">No transactions yet</p>
            <p className="text-sm text-gray-500 mt-1">Your recent transactions will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
      
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 min-w-0"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0 mr-3">
              <div className={`p-2 rounded-full flex-shrink-0 ${
                transaction.type === 'income' 
                  ? 'bg-green-900 text-green-400' 
                  : 'bg-red-900 text-red-400'
              }`}>
                {transaction.type === 'income' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm truncate" title={transaction.description}>
                  {transaction.description}
                </p>
                <p className="text-xs text-gray-400 truncate" title={`${transaction.type === 'income' ? 'Income' : getCategoryName(transaction.category)} • ${format(parseISO(transaction.date), 'MMM dd, yyyy')}`}>
                  {transaction.type === 'income' ? 'Income' : getCategoryName(transaction.category)} • {' '}
                  {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="text-right flex-shrink-0">
              <p className={`font-semibold text-sm ${
                transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <button className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors duration-200">
          View All Transactions
        </button>
      </div>
    </div>
  );
};

export default RecentTransactions;