import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, getDocs, query, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { BankAccount } from '../types';

interface UseBankAccountsResult {
  bankAccounts: BankAccount[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBankAccounts(userId: string | undefined): UseBankAccountsResult {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const accountsRef = collection(db, 'users', userId, 'bankAccounts');
      const q = query(accountsRef);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BankAccount[];
      setBankAccounts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setBankAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const accountsRef = collection(db, 'users', userId, 'bankAccounts');
    const q = query(accountsRef);
    const unsubscribe = onSnapshot(q, async (snapshot: QuerySnapshot<DocumentData>) => {
      if (snapshot.empty) {
        // Fallback: force fetch from server in case of cache staleness
        try {
          const fallbackSnapshot = await getDocs(q);
          const data = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BankAccount[];
          setBankAccounts(data);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch bank accounts');
        } finally {
          setLoading(false);
        }
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BankAccount[];
        setBankAccounts(data);
        setLoading(false);
      }
    }, (err) => {
      setError(err.message || 'Failed to listen for bank accounts');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  return { bankAccounts, loading, error, refresh };
} 