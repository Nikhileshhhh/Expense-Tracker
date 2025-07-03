import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, getDocs, query, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { Expense } from '../types';

interface UseExpensesResult {
  expenses: Expense[];
  totalExpenses: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useExpenses(userId: string | undefined, bankAccountId: string | undefined): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!userId || !bankAccountId) return;
    setLoading(true);
    setError(null);
    try {
      const expensesRef = collection(db, 'users', userId, 'bankAccounts', bankAccountId, 'expenses');
      const q = query(expensesRef);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      setExpenses(data);
      setTotalExpenses(data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [userId, bankAccountId]);

  useEffect(() => {
    if (!userId || !bankAccountId) {
      setExpenses([]);
      setTotalExpenses(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const expensesRef = collection(db, 'users', userId, 'bankAccounts', bankAccountId, 'expenses');
    const q = query(expensesRef);
    const unsubscribe = onSnapshot(q, async (snapshot: QuerySnapshot<DocumentData>) => {
      if (snapshot.empty) {
        // Fallback: force fetch from server in case of cache staleness
        try {
          const fallbackSnapshot = await getDocs(q);
          const data = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
          setExpenses(data);
          setTotalExpenses(data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
        } catch (err: any) {
          setError(err.message || 'Failed to fetch expenses');
        } finally {
          setLoading(false);
        }
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
        setExpenses(data);
        setTotalExpenses(data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
        setLoading(false);
      }
    }, (err) => {
      setError(err.message || 'Failed to listen for expenses');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId, bankAccountId]);

  return { expenses, totalExpenses, loading, error, refresh };
} 