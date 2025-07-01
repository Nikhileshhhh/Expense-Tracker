import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Expense } from '../../types';
import { defaultExpenseCategories, getCategoryColor, getCategoryName } from '../../utils/categories';
import { calculateCategoryExpenses, formatCurrency } from '../../utils/calculations';

interface ExpenseChartProps {
  expenses: Expense[];
  chartType: 'pie' | 'bar';
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses, chartType }) => {
  const chartData = defaultExpenseCategories.map(category => {
    const amount = calculateCategoryExpenses(expenses, category.id);
    return {
      name: category.name,
      value: amount,
      color: category.color,
      category: category.id
    };
  }).filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-800 p-3 border border-gray-600 rounded-lg shadow-lg">
          <p className="font-semibold text-white">{data.payload.name}</p>
          <p className="text-red-400">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Expense Breakdown</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <PieChart className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-400">No expense data available</p>
            <p className="text-sm text-gray-500 mt-1">Add some expenses to see the breakdown</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Expense Breakdown</h3>
        <div className="text-sm text-gray-400">
          Total: {formatCurrency(chartData.reduce((sum, item) => sum + item.value, 0))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
              />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseChart;