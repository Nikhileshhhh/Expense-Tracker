import { useEffect, useState } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';

export interface MonthlySummary {
  month: string;
  year: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  savingsRate: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function useMonthlySummaries(userId: string | undefined, bankAccountId: string | undefined, year: number) {
  const [summaries, setSummaries] = useState<MonthlySummary[]>(() =>
    MONTHS.map((month) => ({
      month,
      year,
      monthlyIncome: 0,
      monthlyExpense: 0,
      monthlySavings: 0,
      savingsRate: 0,
    }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !bankAccountId || !year) {
      setSummaries(MONTHS.map((month) => ({
        month,
        year,
        monthlyIncome: 0,
        monthlyExpense: 0,
        monthlySavings: 0,
        savingsRate: 0,
      })));
      setLoading(false);
      return;
    }
    setLoading(true);
    const colRef = collection(db, 'users', userId, 'bankAccounts', bankAccountId, 'monthlySummaries');
    const unsubscribe = onSnapshot(colRef, (snapshot: QuerySnapshot<DocumentData>) => {
      const docs = snapshot.docs.map(doc => doc.data() as MonthlySummary);
      console.log('🔥 Firestore monthlySummaries docs:', docs);
      // Map to a lookup by month name (case-insensitive)
      const lookup: Record<string, MonthlySummary> = {};
      docs.forEach(doc => {
        if (doc.year === year && doc.month) {
          lookup[doc.month.toLowerCase()] = doc;
        }
      });
      console.log('🔥 Lookup object:', lookup);
      // Fill in all months, defaulting to 0 if missing
      const result = MONTHS.map((month) => {
        const found = lookup[month.toLowerCase()];
        return found ? found : {
          month,
          year,
          monthlyIncome: 0,
          monthlyExpense: 0,
          monthlySavings: 0,
          savingsRate: 0,
        };
      });
      setSummaries(result);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId, bankAccountId, year]);

  return { summaries, loading };
} 