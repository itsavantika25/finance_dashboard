import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      if (usr) {
        setUser({
          uid: usr.uid,
          email: usr.email,
          name: usr.displayName || 'User',
          avatar: usr.displayName ? usr.displayName[0].toUpperCase() : 'A'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginEmail = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signupEmail = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: name });
    setUser({
      uid: res.user.uid,
      email: res.user.email,
      name: name,
      avatar: name[0].toUpperCase()
    });
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, loginGoogle, loginEmail, signupEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
