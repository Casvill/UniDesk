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

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'needs-profile';

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
    profile: UserProfile | null;
  }>;
  completeProfile: (data: { username: string; displayName: string; photoURL?: string }) => Promise<UserProfile>;
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

          if (backendProfile) {
            setProfile(backendProfile);
            setStatus('authenticated');
          } else {
            setProfile(null);
            setStatus('needs-profile');
          }
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

    if (existingProfile) {
      setProfile(existingProfile);
      setStatus('authenticated');

      return {
        user: result.user,
        isNewUser: false,
        profile: existingProfile
      };
    } else {
      setProfile(null);
      setStatus('needs-profile');

      return {
        user: result.user,
        isNewUser: true,
        profile: null
      };
    }
  };

  const completeProfile = async (data: { username: string; displayName: string; photoURL?: string }): Promise<UserProfile> => {
    if (!user) throw new Error('Not authenticated');

    const token = await user.getIdToken();
    const newProfile = await api.createProfile(data, token);

    setProfile(newProfile);
    setStatus('authenticated');

    return newProfile;
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
    completeProfile,
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