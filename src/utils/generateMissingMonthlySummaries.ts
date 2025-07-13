// Only export types, remove all functions for auto-generating monthly summaries
export interface MonthlySummary {
  month: string;
  year: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  savingsRate: number;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  nickname?: string;
  startingBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  createdAt: string;
} 