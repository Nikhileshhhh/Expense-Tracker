import React, { useState } from 'react';
import { ChevronDown, Plus, Building, Wallet } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getBankById } from '../utils/banks';
import { formatCurrency } from '../utils/calculations';
import AddBankAccountForm from './forms/AddBankAccountForm';

const BankAccountSelector: React.FC = () => {
  const { bankAccounts, selectedBankAccount, setSelectedBankAccount } = useData();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAccountSelect = (account: any) => {
    setSelectedBankAccount(account);
    setIsDropdownOpen(false);
  };

  if (bankAccounts.length === 0) {
    return (
      <>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Bank Accounts</h3>
          <p className="text-gray-400 mb-4">Add your first bank account to start tracking your finances</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add Bank Account</span>
          </button>
        </div>
        <AddBankAccountForm isOpen={showAddForm} onClose={() => setShowAddForm(false)} />
      </>
    );
  }

  const selectedBank = selectedBankAccount ? getBankById(selectedBankAccount.bankName) : null;

  return (
    <>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wallet className="h-5 w-5 text-red-400" />
            <span className="text-sm font-medium text-gray-300">Active Account:</span>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </button>
        </div>

        <div className="relative mt-3">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3">
              {selectedBank && (
                <span className="text-lg">{selectedBank.icon}</span>
              )}
              <div className="text-left">
                <p className="font-medium text-white">
                  {selectedBankAccount?.nickname || selectedBank?.name || 'Select Account'}
                </p>
                {selectedBankAccount && (
                  <p className="text-sm text-gray-400">
                    Balance: {formatCurrency(selectedBankAccount.currentBalance)}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {bankAccounts.map((account) => {
                const bank = getBankById(account.bankName);
                return (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSelect(account)}
                    className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-600 transition-colors duration-200 ${
                      selectedBankAccount?.id === account.id ? 'bg-red-900' : ''
                    }`}
                  >
                    {bank && <span className="text-lg">{bank.icon}</span>}
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {account.nickname || bank?.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatCurrency(account.currentBalance)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddBankAccountForm isOpen={showAddForm} onClose={() => setShowAddForm(false)} />
    </>
  );
};

export default BankAccountSelector;