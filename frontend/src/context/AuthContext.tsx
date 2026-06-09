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
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Si estamos procesando un login/registro manualmente, dejamos que esa función maneje el estado
        if (isProcessing) return;

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
          console.error('Error fetching profile in listener:', error);
          // Si hay un error de red o similar, no podemos asegurar que esté autenticado.
          // Es mejor mostrar un estado que obligue a re-intentar o muestre el error.
          // No seteamos 'authenticated' si no tenemos el perfil.
          setProfile(null);
          setStatus('unauthenticated');
        }
      } else {
        setProfile(null);
        setStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, [isProcessing]);

  const login = async (email: string, pass: string) => {
    // No usamos isProcessing aquí para que onAuthStateChanged cargue el perfil automáticamente
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    setIsProcessing(true);
    try {
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
    } finally {
      setIsProcessing(false);
    }
  };

  const completeProfile = async (data: { username: string; displayName: string; photoURL?: string }): Promise<UserProfile> => {
    if (!user) throw new Error('Not authenticated');

    setIsProcessing(true);
    try {
      const token = await user.getIdToken();
      const newProfile = await api.createProfile(data, token);

      setProfile(newProfile);
      setStatus('authenticated');

      return newProfile;
    } finally {
      setIsProcessing(false);
    }
  };

  const register = async (email: string, pass: string, name: string, username: string) => {
    setIsProcessing(true);
    let userCredential;
    
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, pass);

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

      if (userCredential?.user) {
        try {
          await deleteUser(userCredential.user);
        } catch (deleteError) {
          console.error('Error deleting Firebase user after profile creation failed:', deleteError);
        }
      }

      throw createCodedError(
        backendErrorCode,
        getErrorMessage(error) || 'Profile creation failed'
      );
    } finally {
      setIsProcessing(false);
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