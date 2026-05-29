import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

import { auth } from '../shared/services/firebase';
import { api, UserProfile } from '../services/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<{
    user: User;
    isNewUser: boolean;
    profile: UserProfile;
  }>;
  register: (email: string, pass: string, name: string, username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          const token = await currentUser.getIdToken();
          const backendProfile = await api.getProfile(currentUser.uid, token);

          setProfile(backendProfile);
          setStatus('authenticated');
        } catch (error) {
          console.error('Error fetching profile:', error);
          setStatus('authenticated');
        }
      } else {
        setUser(null);
        setProfile(null);
        setStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const token = await result.user.getIdToken();

    const existingProfile = await api.getProfile(result.user.uid, token);

    const isNewUser = !existingProfile;

    const profile = isNewUser
      ? await api.createProfile(
          {
            username:
              result.user.email?.split('@')[0] ||
              `user_${result.user.uid.slice(0, 5)}`,
            displayName: result.user.displayName || 'Usuario de Google',
            photoURL: result.user.photoURL || ''
          },
          token
        )
      : existingProfile;

    setProfile(profile);

    return {
      user: result.user,
      isNewUser,
      profile
    };
  };

  const register = async (email: string, pass: string, name: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);

    await updateProfile(userCredential.user, { displayName: name });

    const token = await userCredential.user.getIdToken();

    const newProfile = await api.createProfile(
      {
        username,
        displayName: name
      },
      token
    );

    setProfile(newProfile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthContextType = {
    user,
    profile,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    logout,
    login,
    loginWithGoogle,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};