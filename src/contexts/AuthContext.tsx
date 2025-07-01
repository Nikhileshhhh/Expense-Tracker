import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { createUserDocument } from '../utils/createUserDocument';

interface AuthContextType {
  user: FirebaseUser | null;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => void;
  updateUserDocument: (displayName: string) => Promise<void>;
  readUserDocument: () => Promise<void>;
  setUser: (user: FirebaseUser | null) => void;
  refreshKey: number;
  isGoogleUser: boolean;
  isEmailPasswordUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper functions to detect user type
  const isGoogleUser = (user: FirebaseUser | null): boolean => {
    return user?.providerData.some(provider => provider.providerId === 'google.com') || false;
  };

  const isEmailPasswordUser = (user: FirebaseUser | null): boolean => {
    return user?.providerData.some(provider => provider.providerId === 'password') || false;
  };

  // Check if user document exists in Firestore
  const checkUserDocument = async (user: FirebaseUser): Promise<boolean> => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user document:', error);
      return false;
    }
  };

  // Create user document if it doesn't exist
  const ensureUserDocument = async (user: FirebaseUser) => {
    try {
      const documentExists = await checkUserDocument(user);
      
      console.log('🔍 User authentication details:');
      console.log('  - UID:', user.uid);
      console.log('  - Email:', user.email);
      console.log('  - Display Name:', user.displayName);
      console.log('  - Provider:', user.providerData[0]?.providerId);
      console.log('  - Document exists:', documentExists);
      
      if (!documentExists) {
        console.log('📄 Creating user document for:', user.uid);
        
        // Use displayName from Google or email as fallback
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        
        await createUserDocument(user, displayName);
        console.log('✅ User document created successfully');
      } else {
        console.log('✅ User document already exists');
        
        // Update existing document with current provider info if needed
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const existingData = userDoc.data();
        
        if (existingData && existingData.providerId !== user.providerData[0]?.providerId) {
          console.log('🔄 Updating provider information in existing document');
          await setDoc(userRef, {
            providerId: user.providerData[0]?.providerId || 'unknown',
            isGoogleUser: isGoogleUser(user),
            isEmailPasswordUser: isEmailPasswordUser(user),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
    } catch (error) {
      console.error('❌ Error ensuring user document:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Only allow Google users or verified email/password users
        const isGoogle = isGoogleUser(user);
        const isEmailPassword = isEmailPasswordUser(user);
        if (isEmailPassword && !user.emailVerified) {
          alert('Please verify your email before logging in.');
          await signOut(auth);
          setUser(null);
          setIsLoading(false);
          return;
        }
        setUser(user);
        // Ensure user document exists for all users (Google and Email/Password)
        await ensureUserDocument(user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUser = () => {
    // Force a re-render by updating the user state with current auth user
    const currentUser = auth.currentUser;
    console.log('🔄 Refreshing user state with:', currentUser?.displayName);
    
    // Force a complete re-render by updating the refresh key
    setRefreshKey(prev => prev + 1);
    
    // Update the user state with the current auth user
    setUser(currentUser);
  };

  const readUserDocument = async () => {
    if (!user) {
      console.error('❌ No user available for document read');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        console.log('✅ User document exists:', userDoc.data());
      } else {
        console.log('❌ User document does not exist');
      }
    } catch (error: any) {
      console.error('❌ Error reading user document:', error);
    }
  };

  const updateUserDocument = async (displayName: string) => {
    if (!user) {
      console.error('❌ No user available for document update');
      return;
    }
    
    console.log('📄 Starting Firestore update for user:', user.uid);
    console.log('📝 New display name:', displayName);
    console.log('🔍 User type:', isGoogleUser(user) ? 'Google' : 'Email/Password');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      console.log('📄 User document reference created:', userRef.path);
      
      const updateData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        updatedAt: serverTimestamp(),
        providerId: user.providerData[0]?.providerId || 'unknown'
      };
      
      console.log('📄 Update data:', updateData);
      
      await setDoc(userRef, updateData, { merge: true });
      
      console.log('✅ User document updated successfully:', user.uid, 'with displayName:', displayName);
      
    } catch (error: any) {
      console.error('❌ Error updating user document:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      logout, 
      isLoading, 
      refreshUser, 
      updateUserDocument, 
      readUserDocument, 
      setUser,
      refreshKey,
      isGoogleUser: isGoogleUser(user),
      isEmailPasswordUser: isEmailPasswordUser(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
};
