import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

interface MonthlySummary {
  month: string;
  year: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  savingsRate: number;
  createdAt: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  nickname?: string;
  startingBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  createdAt: string;
}

interface Income {
  id: string;
  amount: number;
  date: string;
  bankAccountId: string;
  description?: string;
  source?: string;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  bankAccountId: string;
  category: string;
  description?: string;
}

/**
 * Generates monthly summaries for all bank accounts of a user
 * Creates a subcollection called 'monthlySummaries' for each bank account
 * with 12 documents for each month of the current year
 */
export const generateMonthlySummariesForAllBankAccounts = async (uid: string): Promise<void> => {
  try {
    console.log(`🔄 Starting monthly summaries generation for user: ${uid}`);
    
    // Get current year
    const currentYear = new Date().getFullYear();
    console.log(`📅 Generating summaries for year: ${currentYear}`);
    
    // Get all bank accounts for the user
    const bankAccountsRef = collection(db, 'users', uid, 'bankAccounts');
    const bankAccountsSnapshot = await getDocs(bankAccountsRef);
    
    if (bankAccountsSnapshot.empty) {
      console.log('⚠️ No bank accounts found for user');
      return;
    }
    
    console.log(`🏦 Found ${bankAccountsSnapshot.docs.length} bank accounts`);
    
    // Array of month names and their abbreviations
    const months = [
      { name: 'January', abbr: 'jan' },
      { name: 'February', abbr: 'feb' },
      { name: 'March', abbr: 'mar' },
      { name: 'April', abbr: 'apr' },
      { name: 'May', abbr: 'may' },
      { name: 'June', abbr: 'jun' },
      { name: 'July', abbr: 'jul' },
      { name: 'August', abbr: 'aug' },
      { name: 'September', abbr: 'sep' },
      { name: 'October', abbr: 'oct' },
      { name: 'November', abbr: 'nov' },
      { name: 'December', abbr: 'dec' }
    ];
    
    // Process each bank account
    for (const bankAccountDoc of bankAccountsSnapshot.docs) {
      const bankAccount = bankAccountDoc.data() as BankAccount;
      const bankAccountId = bankAccountDoc.id;
      
      console.log(`📊 Processing bank account: ${bankAccount.nickname || bankAccount.bankName} (${bankAccountId})`);
      
      // Create monthlySummaries subcollection reference
      const monthlySummariesRef = collection(db, 'users', uid, 'bankAccounts', bankAccountId, 'monthlySummaries');
      
      // Generate 12 monthly summary documents
      for (const month of months) {
        const documentId = `${month.abbr}_${currentYear}`;
        const monthlySummary: MonthlySummary = {
          month: month.name,
          year: currentYear,
          monthlyIncome: 0,
          monthlyExpense: 0,
          monthlySavings: 0,
          savingsRate: 0,
          createdAt: new Date().toISOString()
        };
        
        // Create the document
        const monthlySummaryDoc = doc(monthlySummariesRef, documentId);
        await setDoc(monthlySummaryDoc, monthlySummary);
        
        console.log(`✅ Created monthly summary: ${documentId} for ${bankAccount.nickname || bankAccount.bankName}`);
      }
      
      console.log(`✅ Completed monthly summaries for bank account: ${bankAccount.nickname || bankAccount.bankName}`);
    }
    
    console.log(`🎉 Successfully generated monthly summaries for all bank accounts of user: ${uid}`);
    
  } catch (error) {
    console.error('❌ Error generating monthly summaries:', error);
    throw new Error(`Failed to generate monthly summaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Alternative function that also calculates actual monthly data from transactions
 * This version populates the monthly summaries with real transaction data
 */
export const generateMonthlySummariesWithTransactionData = async (uid: string): Promise<void> => {
  try {
    console.log(`🔄 Starting monthly summaries generation with transaction data for user: ${uid}`);
    
    // Get current year
    const currentYear = new Date().getFullYear();
    console.log(`📅 Generating summaries for year: ${currentYear}`);
    
    // Get all bank accounts for the user
    const bankAccountsRef = collection(db, 'users', uid, 'bankAccounts');
    const bankAccountsSnapshot = await getDocs(bankAccountsRef);
    
    if (bankAccountsSnapshot.empty) {
      console.log('⚠️ No bank accounts found for user');
      return;
    }
    
    console.log(`🏦 Found ${bankAccountsSnapshot.docs.length} bank accounts`);
    
    // Array of month names and their abbreviations
    const months = [
      { name: 'January', abbr: 'jan', monthNumber: 0 },
      { name: 'February', abbr: 'feb', monthNumber: 1 },
      { name: 'March', abbr: 'mar', monthNumber: 2 },
      { name: 'April', abbr: 'apr', monthNumber: 3 },
      { name: 'May', abbr: 'may', monthNumber: 4 },
      { name: 'June', abbr: 'jun', monthNumber: 5 },
      { name: 'July', abbr: 'jul', monthNumber: 6 },
      { name: 'August', abbr: 'aug', monthNumber: 7 },
      { name: 'September', abbr: 'sep', monthNumber: 8 },
      { name: 'October', abbr: 'oct', monthNumber: 9 },
      { name: 'November', abbr: 'nov', monthNumber: 10 },
      { name: 'December', abbr: 'dec', monthNumber: 11 }
    ];
    
    // Process each bank account
    for (const bankAccountDoc of bankAccountsSnapshot.docs) {
      const bankAccount = bankAccountDoc.data() as BankAccount;
      const bankAccountId = bankAccountDoc.id;
      
      console.log(`📊 Processing bank account: ${bankAccount.nickname || bankAccount.bankName} (${bankAccountId})`);
      
      // Get incomes for this bank account
      const incomesRef = collection(db, 'users', uid, 'bankAccounts', bankAccountId, 'incomes');
      const incomesSnapshot = await getDocs(incomesRef);
      const incomes = incomesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];
      
      // Get expenses for this bank account
      const expensesRef = collection(db, 'users', uid, 'bankAccounts', bankAccountId, 'expenses');
      const expensesSnapshot = await getDocs(expensesRef);
      const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      
      console.log(`💰 Found ${incomes.length} incomes and ${expenses.length} expenses`);
      
      // Create monthlySummaries subcollection reference
      const monthlySummariesRef = collection(db, 'users', uid, 'bankAccounts', bankAccountId, 'monthlySummaries');
      
      // Generate 12 monthly summary documents
      for (const month of months) {
        const documentId = `${month.abbr}_${currentYear}`;
        
        // Calculate monthly income for this month
        const monthlyIncome = incomes
          .filter(income => {
            const incomeDate = new Date(income.date);
            return incomeDate.getFullYear() === currentYear && incomeDate.getMonth() === month.monthNumber;
          })
          .reduce((sum, income) => sum + income.amount, 0);
        
        // Calculate monthly expenses for this month
        const monthlyExpense = expenses
          .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === month.monthNumber;
          })
          .reduce((sum, expense) => sum + expense.amount, 0);
        
        // Calculate monthly savings
        const monthlySavings = monthlyIncome - monthlyExpense;
        
        // Calculate savings rate
        const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
        
        const monthlySummary: MonthlySummary = {
          month: month.name,
          year: currentYear,
          monthlyIncome,
          monthlyExpense,
          monthlySavings,
          savingsRate,
          createdAt: new Date().toISOString()
        };
        
        // Create the document
        const monthlySummaryDoc = doc(monthlySummariesRef, documentId);
        await setDoc(monthlySummaryDoc, monthlySummary);
        
        console.log(`✅ Created monthly summary: ${documentId} - Income: ${monthlyIncome}, Expense: ${monthlyExpense}, Savings: ${monthlySavings}`);
      }
      
      console.log(`✅ Completed monthly summaries for bank account: ${bankAccount.nickname || bankAccount.bankName}`);
    }
    
    console.log(`🎉 Successfully generated monthly summaries with transaction data for all bank accounts of user: ${uid}`);
    
  } catch (error) {
    console.error('❌ Error generating monthly summaries with transaction data:', error);
    throw new Error(`Failed to generate monthly summaries with transaction data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Utility function to check if monthly summaries already exist for a bank account
 */
export const checkMonthlySummariesExist = async (uid: string, bankAccountId: string): Promise<boolean> => {
  try {
    const monthlySummariesRef = collection(db, 'users', uid, 'bankAccounts', bankAccountId, 'monthlySummaries');
    const snapshot = await getDocs(monthlySummariesRef);
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Error checking monthly summaries:', error);
    return false;
  }
};

/**
 * Utility function to get monthly summary for a specific month
 */
export const getMonthlySummary = async (
  uid: string, 
  bankAccountId: string, 
  month: string, 
  year: number
): Promise<MonthlySummary | null> => {
  try {
    const documentId = `${month.toLowerCase()}_${year}`;
    const monthlySummariesRef = collection(db, 'users', uid, 'bankAccounts', bankAccountId, 'monthlySummaries');
    const snapshot = await getDocs(monthlySummariesRef);
    
    const monthlySummaryDoc = snapshot.docs.find(docSnapshot => docSnapshot.id === documentId);
    if (monthlySummaryDoc) {
      return monthlySummaryDoc.data() as MonthlySummary;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting monthly summary:', error);
    return null;
  }
};

/**
 * Example usage:
 * 
 * // Basic usage - creates empty monthly summaries
 * await generateMonthlySummariesForAllBankAccounts(user.uid);
 * 
 * // Advanced usage - creates monthly summaries with actual transaction data
 * await generateMonthlySummariesWithTransactionData(user.uid);
 * 
 * // Check if summaries exist
 * const exists = await checkMonthlySummariesExist(user.uid, bankAccountId);
 * 
 * // Get specific monthly summary
 * const januarySummary = await getMonthlySummary(user.uid, bankAccountId, 'jan', 2025);
 */

// Export types for external use
export type { MonthlySummary, BankAccount, Income, Expense }; 