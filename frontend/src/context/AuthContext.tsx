import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser
} from 'firebase/auth';

import { auth } from '../shared/services/firebase';
import { api, UserProfile } from '../services/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'needs-profile';

type UpdateProfileData = {
  username?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  university?: string;
};

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
  updateProfileData: (data: UpdateProfileData) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createCodedError(code: string, message: string) {
  const error = new Error(message) as Error & { code?: string };
  error.code = code;
  return error;
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return '';
}

function getBackendErrorCode(error: unknown): string {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed') ||
    message.includes('err_connection_refused')
  ) {
    return 'backend/profile-create-failed';
  }

  if (
    message.includes('username') ||
    message.includes('usuario') ||
    message.includes('already exists') ||
    message.includes('ocupado')
  ) {
    return 'backend/username-already-exists';
  }

  if (
    message.includes('email') ||
    message.includes('correo')
  ) {
    return 'backend/email-already-exists';
  }

  return 'backend/profile-create-failed';
}

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
          console.warn('No se pudo cargar el perfil del usuario:', error);

          setProfile(null);
          setStatus('needs-profile');
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

    try {
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
      setStatus('authenticated');
    } catch (error) {
      const backendErrorCode = getBackendErrorCode(error);

      try {
        await deleteUser(userCredential.user);
      } catch (deleteError) {
        console.error('Error deleting Firebase user after profile creation failed:', deleteError);
      }

      throw createCodedError(
        backendErrorCode,
        getErrorMessage(error) || 'Profile creation failed'
      );
    }
  };

  const updateProfileData = async (data: UpdateProfileData): Promise<UserProfile> => {
    if (!user) throw new Error('Not authenticated');

    const token = await user.getIdToken();

    const updatedProfile = await api.updateProfile(
      user.uid,
      data,
      token
    );

    setProfile(updatedProfile);
    setStatus('authenticated');

    return updatedProfile;
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
    updateProfileData,
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