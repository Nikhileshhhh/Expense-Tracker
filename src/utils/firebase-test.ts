// Simple test to verify Firebase connection
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { createUserDocument } from './createUserDocument';

export const testFirebaseConnection = async () => {
  try {
    // Try to access Firestore
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    console.log('✅ Firebase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};

export const testUserDocumentCreation = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('⚠️ No user logged in. Please sign in first.');
      return false;
    }

    // Test creating a user document
    await createUserDocument(currentUser, currentUser.displayName || 'Test User');
    
    // Verify the document was created
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log('✅ User document exists:', userDoc.data());
      return true;
    } else {
      console.log('❌ User document not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing user document creation:', error);
    return false;
  }
};

// Test function that can be called from browser console
(window as any).testFirebase = testFirebaseConnection;
(window as any).testUserDoc = testUserDocumentCreation; 