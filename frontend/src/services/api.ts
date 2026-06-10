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
  university?: string;
}

export interface Room {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

type ApiError = Error & {
  code?: string;
  status?: number;
};

function createApiError(message: string, code: string, status?: number): ApiError {
  const error = new Error(message) as ApiError;
  error.code = code;
  error.status = status;
  return error;
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const errorData = await response.json();

    if (typeof errorData?.message === 'string') {
      return errorData.message;
    }

    if (typeof errorData?.error === 'string') {
      return errorData.error;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function getConflictCode(message: string): string {
  const cleanMessage = message.toLowerCase();

  if (
    cleanMessage.includes('username') ||
    cleanMessage.includes('usuario') ||
    cleanMessage.includes('user name') ||
    cleanMessage.includes('nombre de usuario') ||
    cleanMessage.includes('ocupado') ||
    cleanMessage.includes('taken')
  ) {
    return 'backend/username-already-exists';
  }

  if (
    cleanMessage.includes('email') ||
    cleanMessage.includes('correo') ||
    cleanMessage.includes('mail')
  ) {
    return 'backend/email-already-exists';
  }

  return 'backend/request-failed';
}

function handleNetworkError(error: unknown, fallbackMessage: string): never {
  if (error instanceof TypeError) {
    throw createApiError(fallbackMessage, 'backend/network-error');
  }

  throw error;
}

export const api = {
  async getProfile(uid: string, token: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_URL}/users/${uid}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.status === 404) return null;

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Error al obtener el perfil');

        throw createApiError(
          message,
          'backend/profile-fetch-failed',
          response.status
        );
      }

      return response.json();
    } catch (error) {
      handleNetworkError(
        error,
        'No pudimos conectar con el servidor para obtener el perfil'
      );
    }
  },

  async createProfile(
    data: {
      username: string;
      displayName: string;
      photoURL?: string;
    },
    token: string
  ): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Error al crear el perfil');

        const code =
          response.status === 409
            ? getConflictCode(message)
            : 'backend/profile-create-failed';

        throw createApiError(message, code, response.status);
      }

      return response.json();
    } catch (error) {
      handleNetworkError(
        error,
        'No pudimos conectar con el servidor para crear el perfil'
      );
    }
  },

  async checkEmail(email: string, excludeUid?: string): Promise<boolean> {
    try {
      let url = `${API_URL}/users/email/${encodeURIComponent(email)}/available`;

      if (excludeUid) {
        url += `?excludeUid=${encodeURIComponent(excludeUid)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      return Boolean(data.available);
    } catch {
      return false;
    }
  },

  async checkUsername(username: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URL}/users/username/${encodeURIComponent(username)}/available`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) return false;

      const data = await response.json();
      return Boolean(data.available);
    } catch {
      return false;
    }
  },

  async updateProfile(
    uid: string,
    data: {
      username?: string;
      displayName?: string;
      email?: string;
      photoURL?: string;
      university?: string;
    },
    token: string
  ): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_URL}/users/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Error al actualizar el perfil');

        const code =
          response.status === 409
            ? getConflictCode(message)
            : 'backend/profile-update-failed';

        throw createApiError(message, code, response.status);
      }

      return response.json();
    } catch (error) {
      handleNetworkError(
        error,
        'No pudimos conectar con el servidor para actualizar el perfil'
      );
    }
  },

  async deleteProfile(uid: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/users/${uid}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Error al eliminar la cuenta');

        let code = 'backend/profile-delete-failed';

        if (response.status === 401) {
          code = 'backend/unauthorized';
        }

        if (response.status === 403) {
          code = 'backend/forbidden';
        }

        if (response.status === 404) {
          code = 'backend/profile-not-found';
        }

        throw createApiError(message, code, response.status);
      }
    } catch (error) {
      handleNetworkError(
        error,
        'No pudimos conectar con el servidor para eliminar la cuenta'
      );
    }
  },

  async listRooms(token: string): Promise<Room[]> {
    try {
      const response = await fetch(`${API_URL}/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Error al obtener las salas');

        throw createApiError(
          message,
          'backend/rooms-fetch-failed',
          response.status
        );
      }

      return response.json();
    } catch (error) {
      handleNetworkError(
        error,
        'No pudimos conectar con el servidor para obtener las salas'
      );
    }
  },

  async createRoom(name: string, token: string): Promise<Room> {
    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Error al crear la sala');

        throw createApiError(
          message,
          'backend/room-create-failed',
          response.status
        );
      }

      return response.json();
    } catch (error) {
      handleNetworkError(
        error,
        'No pudimos conectar con el servidor para crear la sala'
      );
    }
  },
};
