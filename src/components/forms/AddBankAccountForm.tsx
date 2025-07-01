import React, { useState } from 'react';
import { X, DollarSign, Tag, Building } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { predefinedBanks } from '../../utils/banks';
import { validateAndRoundAmount } from '../../utils/calculations';

interface AddBankAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddBankAccountForm: React.FC<AddBankAccountFormProps> = ({ isOpen, onClose }) => {
  const { addBankAccount, bankAccounts } = useData();
  const [formData, setFormData] = useState({
    bankName: '',
    nickname: '',
    startingBalance: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bankName || !formData.startingBalance) {
      alert('Please fill in all required fields');
      return;
    }

    // Check for duplicate nickname (case-insensitive, ignore empty)
    if (formData.nickname.trim()) {
      const exists = bankAccounts.some(
        acc => acc.nickname && acc.nickname.trim().toLowerCase() === formData.nickname.trim().toLowerCase()
      );
      if (exists) {
        alert('A bank account with this nickname already exists. Please choose a different nickname.');
        return;
      }
    }

    // Validate and round the balance to 2 decimal places
    const rounded = validateAndRoundAmount(formData.startingBalance);
    if (rounded === null) {
      alert('Please enter a valid positive number for the balance');
      return;
    }

    setIsSubmitting(true);
    try {
      await addBankAccount({
        bankName: formData.bankName,
        bankId: formData.bankName,
        nickname: formData.nickname,
        startingBalance: Number(rounded),
        currentBalance: Number(rounded),
        isActive: formData.isActive
      });

      setFormData({
        bankName: '',
        nickname: '',
        startingBalance: '',
        isActive: true
      });

      // Show success message
      alert('Bank account added successfully! You can now add income and expenses to this account.');
      onClose();
    } catch (error) {
      console.error('Error adding bank account:', error);
      alert('Failed to add bank account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Add Bank Account</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Bank *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white"
                required
              >
                <option value="">Choose your bank</option>
                {predefinedBanks.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.icon} {bank.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Nickname (Optional)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                placeholder="e.g., Salary Account, Savings, Emergency Fund"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Give this account a name for easy identification</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Balance *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                inputMode="decimal"
                value={formData.startingBalance}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow digits, single decimal point, and empty string
                  if (/^\d*\.?\d*$/.test(value) || value === '') {
                    setFormData({ ...formData, startingBalance: value });
                  }
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                placeholder="Enter current balance"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">This will be your starting balance for tracking (will be rounded to 2 decimal places)</p>
          </div>

          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-300 font-medium mb-2">🔒 Privacy & Security</h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• We don't store account numbers or IFSC codes</li>
              <li>• No sensitive banking information is collected</li>
              <li>• Only balance tracking for expense management</li>
              <li>• Your data stays private and secure</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-3 rounded-lg hover:from-red-700 hover:to-red-900 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBankAccountForm;