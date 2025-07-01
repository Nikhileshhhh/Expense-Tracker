import { ExpenseCategory } from '../types';

export const defaultExpenseCategories: ExpenseCategory[] = [
  {
    id: 'utilities',
    name: 'Utilities',
    icon: 'Zap',
    color: '#F59E0B',
    subcategories: ['Electricity', 'Water', 'Gas', 'Internet', 'Mobile']
  },
  {
    id: 'housing',
    name: 'Housing',
    icon: 'Home',
    color: '#8B5CF6',
    subcategories: ['Rent', 'Home Loan EMI', 'Maintenance', 'Property Tax', 'Insurance']
  },
  {
    id: 'food',
    name: 'Food & Groceries',
    icon: 'ShoppingCart',
    color: '#10B981',
    subcategories: ['Groceries', 'Vegetables', 'Dining Out', 'Snacks']
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: 'Car',
    color: '#3B82F6',
    subcategories: ['Fuel', 'Public Transport', 'Vehicle Maintenance', 'Parking']
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: 'Heart',
    color: '#EF4444',
    subcategories: ['Medical Bills', 'Medicines', 'Health Insurance', 'Emergency']
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'GraduationCap',
    color: '#06B6D4',
    subcategories: ['School Fees', 'College Fees', 'Books', 'Tuition', 'Online Courses']
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'Bag',
    color: '#EC4899',
    subcategories: ['Clothing', 'Electronics', 'Personal Care', 'Gifts']
  },
  {
    id: 'taxes',
    name: 'Taxes',
    icon: 'Receipt',
    color: '#6B7280',
    subcategories: ['Income Tax', 'Property Tax', 'GST', 'Other Taxes']
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'Music',
    color: '#F97316',
    subcategories: ['Movies', 'Streaming', 'Games', 'Sports', 'Hobbies']
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'MoreHorizontal',
    color: '#64748B',
    subcategories: ['Miscellaneous']
  }
];

export const getIconComponent = (iconName: string) => iconName;

export const getCategoryColor = (categoryId: string): string => {
  const category = defaultExpenseCategories.find(cat => cat.id === categoryId);
  return category?.color || '#64748B';
};

export const getCategoryName = (categoryId: string): string => {
  const category = defaultExpenseCategories.find(cat => cat.id === categoryId);
  return category?.name || 'Other';
};