import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, getDocs, query, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { Income } from '../types';

interface UseIncomesResult {
  incomes: Income[];
  totalIncome: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useIncomes(userId: string | undefined, bankAccountId: string | undefined): UseIncomesResult {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!userId || !bankAccountId) return;
    setLoading(true);
    setError(null);
    try {
      const incomesRef = collection(db, 'users', userId, 'bankAccounts', bankAccountId, 'incomes');
      const q = query(incomesRef);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];
      setIncomes(data);
      setTotalIncome(data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch incomes');
    } finally {
      setLoading(false);
    }
  }, [userId, bankAccountId]);

  useEffect(() => {
    if (!userId || !bankAccountId) {
      setIncomes([]);
      setTotalIncome(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const incomesRef = collection(db, 'users', userId, 'bankAccounts', bankAccountId, 'incomes');
    const q = query(incomesRef);
    const unsubscribe = onSnapshot(q, async (snapshot: QuerySnapshot<DocumentData>) => {
      if (snapshot.empty) {
        // Fallback: force fetch from server in case of cache staleness
        try {
          const fallbackSnapshot = await getDocs(q);
          const data = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];
          setIncomes(data);
          setTotalIncome(data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
        } catch (err: any) {
          setError(err.message || 'Failed to fetch incomes');
        } finally {
          setLoading(false);
        }
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];
        setIncomes(data);
        setTotalIncome(data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
        setLoading(false);
      }
    }, (err) => {
      setError(err.message || 'Failed to listen for incomes');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId, bankAccountId]);

  return { incomes, totalIncome, loading, error, refresh };
} 