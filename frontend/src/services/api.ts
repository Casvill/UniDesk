const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: 'password' | 'google.com';
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  subject?: string;
  description?: string;
  host?: string;
  participants?: number;
  capacity?: number;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  async getProfile(uid: string, token: string): Promise<UserProfile | null> {
    const response = await fetch(`${API_URL}/users/${uid}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Error al obtener el perfil');
    
    return response.json();
  },

  async createProfile(data: { username: string; displayName: string; photoURL?: string }, token: string): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear el perfil');
    }

    return response.json();
  },

  async checkUsername(username: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/users/username/${username}/available`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.available;
  },

  async updateProfile(uid: string, data: { username?: string; displayName?: string; photoURL?: string }, token: string): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/users/${uid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar el perfil');
    }

    return response.json();
  },

  async deleteProfile(uid: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/users/${uid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar la cuenta');
    }
  },

  async getRoom(id: string, token: string): Promise<Room | null> {
    const response = await fetch(`${API_URL}/rooms/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Error al obtener la sala');
    
    return response.json();
  }
};
