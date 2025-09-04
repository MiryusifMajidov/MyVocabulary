import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  collection, 
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  login: (emailOrUsername: string, password: string) => Promise<User>;
  register: (email: string, username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<User, 'username'>>) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const register = async (email: string, username: string, password: string): Promise<User> => {
    try {
      // First create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Now check if email already exists in our users collection
      const emailQuery = query(collection(db, 'users'), where('email', '==', email));
      const emailDocs = await getDocs(emailQuery);
      if (!emailDocs.empty) {
        // Delete the Firebase Auth user since email already exists
        await firebaseUser.delete();
        throw new Error('Bu email artıq istifadə edilir');
      }

      // Check if username already exists
      const usernameQuery = query(collection(db, 'users'), where('username', '==', username));
      const usernameDocs = await getDocs(usernameQuery);
      if (!usernameDocs.empty) {
        // Delete the Firebase Auth user since username already exists
        await firebaseUser.delete();
        throw new Error('Bu username artıq istifadə edilir');
      }

      const userData: User = {
        id: firebaseUser.uid,
        email,
        username,
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      setCurrentUser(userData);
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const login = async (emailOrUsername: string, password: string): Promise<User> => {
    let email = emailOrUsername;
    
    // If it's not an email, find the email by username
    if (!emailOrUsername.includes('@')) {
      const usernameQuery = query(collection(db, 'users'), where('username', '==', emailOrUsername));
      const usernameDocs = await getDocs(usernameQuery);
      if (usernameDocs.empty) {
        throw new Error('İstifadəçi tapılmadı');
      }
      const userData = usernameDocs.docs[0].data() as User;
      email = userData.email;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      throw new Error('İstifadəçi məlumatları tapılmadı');
    }

    const userData = { ...userDoc.data(), createdAt: userDoc.data().createdAt.toDate() } as User;
    setCurrentUser(userData);
    
    return userData;
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const updateUserProfile = async (updates: Partial<Pick<User, 'username'>>): Promise<void> => {
    if (!firebaseUser || !currentUser) throw new Error('İstifadəçi sistemə daxil olmayıb');

    // Check if new username already exists
    if (updates.username && updates.username !== currentUser.username) {
      const usernameQuery = query(collection(db, 'users'), where('username', '==', updates.username));
      const usernameDocs = await getDocs(usernameQuery);
      if (!usernameDocs.empty) {
        throw new Error('Bu username artıq istifadə edilir');
      }
    }

    await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
    setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateUserPassword = async (newPassword: string): Promise<void> => {
    if (!firebaseUser) throw new Error('İstifadəçi sistemə daxil olmayıb');
    await updatePassword(firebaseUser, newPassword);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = { ...userDoc.data(), createdAt: userDoc.data().createdAt.toDate() } as User;
          setCurrentUser(userData);
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    login,
    register,
    logout,
    updateUserProfile,
    updateUserPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};