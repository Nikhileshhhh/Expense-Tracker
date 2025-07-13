import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BillReminder } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';

interface BillReminderContextType {
  reminders: BillReminder[];
  addReminder: (reminder: BillReminder) => void;
  deleteReminder: (id: string) => void;
  markAsPaid: (id: string) => void;
  getDueReminders: () => BillReminder[];
}

export const BillReminderContext = createContext<BillReminderContextType | undefined>(undefined);

export const useBillReminders = () => {
  const context = useContext(BillReminderContext);
  if (!context) throw new Error('useBillReminders must be used within BillReminderProvider');
  return context;
};

export const BillReminderProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<BillReminder[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'billReminders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: BillReminder[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BillReminder));
      setReminders(data);
    });
    return () => unsubscribe();
  }, [user]);

  const addReminder = async (reminder: BillReminder) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'billReminders', reminder.id);
    await setDoc(ref, reminder);
  };

  const deleteReminder = async (id: string) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'billReminders', id);
    await deleteDoc(ref);
  };

  const markAsPaid = async (id: string) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'billReminders', id);
    await setDoc(ref, { isPaid: true }, { merge: true });
  };

  const getDueReminders = (): BillReminder[] => {
    if (!user?.uid) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return reminders.filter(r => {
      if (r.userId !== user.uid || r.isPaid) return false;

      const due = new Date(r.dueDate);
      due.setHours(0, 0, 0, 0);

      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      switch (r.reminderTime) {
        case 'same-day': return diff === 0;
        case '1-day-before': return diff === 1;
        case '3-days-before': return diff <= 3 && diff >= 0;
        default: return false;
      }
    });
  };

  return (
    <BillReminderContext.Provider value={{ reminders, addReminder, deleteReminder, markAsPaid, getDueReminders }}>
      {children}
    </BillReminderContext.Provider>
  );
};
