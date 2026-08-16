import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  dbUser: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, dbUser: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Unsubscribe from any previous user document snapshot listener
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (firebaseUser) {
        // Immediate check for owner email to prevent any delay
        if (firebaseUser.email === 'malleshr20944@gmail.com') {
          setIsAdmin(true);
        }

        // Real-time synchronization of current user document
        unsubUserDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
          let userIsAdmin = firebaseUser.email === 'malleshr20944@gmail.com';
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setDbUser({ id: userDoc.id, ...data });
            if (data?.isAdmin === true || data?.role === 'admin' || data?.role === 'staff') {
              userIsAdmin = true;
            }
          } else {
            setDbUser(null);
          }

          try {
            // Fetch admin doc to check role
            const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
            if (adminDoc.exists()) {
              userIsAdmin = true;
            }
          } catch (error) {
            console.error("Skipping admins collection check due to permission limit:", error);
          }

          setIsAdmin(userIsAdmin);
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user document:", error);
          setLoading(false);
        });
      } else {
        setDbUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) {
        unsubUserDoc();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, dbUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
