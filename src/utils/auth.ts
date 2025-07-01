import { User } from '../types';

const AUTH_KEY = 'expense_tracker_user';
const USERS_KEY = 'expense_tracker_users';

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(AUTH_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

export const register = (email: string, password: string, name: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    const users = getUsers();

    if (users.some(u => u.email === email)) {
      reject(new Error('User already exists'));
      return;
    }

    const newUser: User = {
      id: generateId(),
      email,
      name,
      createdAt: new Date().toISOString()
    };

    users.push({ ...newUser, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    resolve(newUser);
  });
};

export const login = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      reject(new Error('Invalid credentials'));
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    resolve(userWithoutPassword);
  });
};

const getUsers = (): any[] => {
  const usersStr = localStorage.getItem(USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
};

const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};
