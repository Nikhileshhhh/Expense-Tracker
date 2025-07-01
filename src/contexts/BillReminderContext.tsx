import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BillReminder } from '../types';
import { useAuth } from './AuthContext';

interface BillReminderContextType {
  reminders: BillReminder[];
  addReminder: (reminder: Omit<BillReminder, 'id' | 'createdAt' | 'isPaid'>) => void;
  deleteReminder: (id: string) => void;
  markAsPaid: (id: string) => void;
  getDueReminders: () => BillReminder[];
}

const BillReminderContext = createContext<BillReminderContextType | undefined>(undefined);

export const useBillReminders = () => {
  const context = useContext(BillReminderContext);
  if (!context) throw new Error('useBillReminders must be used within BillReminderProvider');
  return context;
};

const BILL_REMINDERS_KEY = 'BILL_REMINDERS';

export const BillReminderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [allReminders, setAllReminders] = useState<BillReminder[]>([]);
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage only once on mount
  useEffect(() => {
    if (!isInitialized) {
      try {
        const stored = localStorage.getItem(BILL_REMINDERS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setAllReminders(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading bill reminders from localStorage:', error);
        setAllReminders([]);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Filter by user only after user data is loaded and not loading
  useEffect(() => {
    if (!isLoading && isInitialized) {
      if (user && user.uid) {
        const filtered = allReminders.filter(r => r.userId === user.uid);
        setReminders(filtered);
      } else {
        setReminders([]);
      }
    }
  }, [user, allReminders, isLoading, isInitialized]);

  // Save to localStorage when all reminders change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(BILL_REMINDERS_KEY, JSON.stringify(allReminders));
      } catch (error) {
        console.error('Error saving bill reminders to localStorage:', error);
      }
    }
  }, [allReminders, isInitialized]);

  const addReminder = (reminder: Omit<BillReminder, 'id' | 'createdAt' | 'isPaid'>) => {
    const newReminder: BillReminder = {
      ...reminder,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      isPaid: false
    };
    setAllReminders(prev => [...prev, newReminder]);
  };

  const deleteReminder = (id: string) => {
    setAllReminders(prev => prev.filter(r => r.id !== id));
  };

  const markAsPaid = (id: string) => {
    setAllReminders(prev =>
      prev.map(r => r.id === id ? { ...r, isPaid: true } : r)
    );
  };

  const getDueReminders = (): BillReminder[] => {
    if (!user?.uid) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allReminders.filter(r => {
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
    <BillReminderContext.Provider value={{
      reminders,
      addReminder,
      deleteReminder,
      markAsPaid,
      getDueReminders
    }}>
      {children}
    </BillReminderContext.Provider>
  );
};
