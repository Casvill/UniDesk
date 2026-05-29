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
import { auth } from '../services/firebase';
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
  loginWithGoogle: () => Promise<void>;
  register: (email: string, pass: string, name: string, username: string) => Promise<void>;
  updateBackendProfile: (data: { username?: string; displayName?: string; photoURL?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
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
    
    // Verificar si ya tiene perfil en el backend
    const existingProfile = await api.getProfile(result.user.uid, token);
    if (!existingProfile) {
      // Crear perfil por defecto para Google
      const newProfile = await api.createProfile({
        username: result.user.email?.split('@')[0] || `user_${result.user.uid.slice(0, 5)}`,
        displayName: result.user.displayName || 'Usuario de Google',
        photoURL: result.user.photoURL || ''
      }, token);
      setProfile(newProfile);
    } else {
      setProfile(existingProfile);
    }
  };

  const register = async (email: string, pass: string, name: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    const token = await userCredential.user.getIdToken();
    const newProfile = await api.createProfile({
      username,
      displayName: name
    }, token);
    setProfile(newProfile);
  };

  const updateBackendProfile = async (data: { username?: string; displayName?: string; photoURL?: string }) => {
    if (!user) return;
    const token = await user.getIdToken();
    const updated = await api.updateProfile(user.uid, data, token);
    setProfile(updated);
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await api.deleteProfile(user.uid, token);
      // El backend ya elimina el usuario de Firebase Auth
      setUser(null);
      setProfile(null);
      setStatus('unauthenticated');
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
    updateBackendProfile,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
