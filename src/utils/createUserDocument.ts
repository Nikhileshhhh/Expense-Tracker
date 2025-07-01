import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

export const createUserDocument = async (user: User, fullName: string) => {
  if (!user) {
    console.warn('createUserDocument: No user provided');
    return;
  }
  
  try {
    const userRef = doc(db, 'users', user.uid);
    
    // Get provider information
    const providerId = user.providerData[0]?.providerId || 'unknown';
    const isGoogleUser = providerId === 'google.com';
    const isEmailPasswordUser = providerId === 'password';
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: fullName,
      providerId: providerId,
      isGoogleUser: isGoogleUser,
      isEmailPasswordUser: isEmailPasswordUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(userRef, userData, { merge: true });
    
    console.log('✅ User document created successfully:', user.uid);
    console.log('🔍 User type:', isGoogleUser ? 'Google' : 'Email/Password');
    console.log('📄 Document data:', userData);
  } catch (error) {
    console.error('❌ Error creating user document:', error);
    throw error;
  }
}; 