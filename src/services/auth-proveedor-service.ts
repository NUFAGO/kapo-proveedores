import { API_URL, AUTH_PROVEEDOR_COOKIE_NAME, REFRESH_PROVEEDOR_TOKEN_KEY, TOKEN_EXPIRY_DAYS } from '@/lib/constants';
import { setAuthToken, removeAuthToken, getAuthToken } from '@/lib/cookies';

export interface LoginProveedorResponse {
  id: string;
  token: string;
  usuario: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  proveedor_id: string;
  proveedor_nombre: string;
  estado: 'ACTIVO' | 'PENDIENTE' | 'BLOQUEADO' | 'INACTIVO';
}

export interface TokenVerifyResponse {
  id: string;
  tipo_usuario: string;
  proveedor_id: string;
  estado: string;
  iat: number;
  exp: number;
}

export interface TokenRefreshResponse {
  payload: TokenVerifyResponse;
  token: string;
}

class AuthProveedorService {
  private refreshPromise: Promise<string | null> | null = null;

  /**
   * Inicia sesión para usuarios proveedor
   */
  async login(usuario: string, contrasenna: string): Promise<LoginProveedorResponse> {
    const query = `
      mutation LoginProveedor($usuario: String!, $contrasenna: String!) {
        loginProveedor(usuario: $usuario, contrasenna: $contrasenna) {
          id
          token
          usuario
          nombres
          apellido_paterno
          apellido_materno
          proveedor_id
          proveedor_nombre
          estado
        }
      }
    `;

    try {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { usuario, contrasenna },
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Credenciales incorrectas');
        } else if (response.status >= 500) {
          throw new Error('Error en el servidor');
        } else {
          throw new Error('Error de conexión');
        }
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Error al procesar la respuesta del servidor');
      }

      if (data.errors) {
        const backendError = data.errors[0]?.message || 'Error en el inicio de sesión';

        if (backendError.toLowerCase().includes('usuario') ||
            backendError.toLowerCase().includes('contraseña') ||
            backendError.toLowerCase().includes('incorrectos') ||
            backendError.toLowerCase().includes('inválidos') ||
            backendError.toLowerCase().includes('unauthorized') ||
            backendError.toLowerCase().includes('authentication')) {
          throw new Error('Credenciales incorrectas');
        }

        throw new Error('Error en el servidor');
      }

      const loginData = data.data.loginProveedor;

      // Adaptar la respuesta del backend
      const adaptedResponse: LoginProveedorResponse = {
        id: loginData.id,
        token: loginData.token,
        usuario: loginData.usuario,
        nombres: loginData.nombres,
        apellido_paterno: loginData.apellido_paterno,
        apellido_materno: loginData.apellido_materno,
        proveedor_id: loginData.proveedor_id,
        proveedor_nombre: loginData.proveedor_nombre,
        estado: loginData.estado,
      };

      // Guardar token en cookie específica para proveedores
      if (typeof window !== 'undefined') {
        setAuthToken(adaptedResponse.token, TOKEN_EXPIRY_DAYS, AUTH_PROVEEDOR_COOKIE_NAME);

        // Guardar refresh token en localStorage
        const refreshTokenData = {
          token: adaptedResponse.token,
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        };
        localStorage.setItem(REFRESH_PROVEEDOR_TOKEN_KEY, JSON.stringify(refreshTokenData));

        // Guardar usuario en localStorage específico para proveedores
        localStorage.setItem('proveedor_user', JSON.stringify(adaptedResponse));
      }

      return adaptedResponse;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Error en el inicio de sesión');
    }
  }

  /**
   * Refresca el token de autenticación de proveedor
   */
  async refreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const token = getAuthToken(AUTH_PROVEEDOR_COOKIE_NAME);
    if (!token) return null;

    // Verificar si el refresh token ha expirado
    const refreshTokenData = localStorage.getItem(REFRESH_PROVEEDOR_TOKEN_KEY);
    if (refreshTokenData) {
      try {
        const parsedData = JSON.parse(refreshTokenData);
        const { expiresAt } = parsedData;

        if (expiresAt && new Date(expiresAt) < new Date()) {
          this.logout();
          return null;
        }
      } catch (parseError) {
        console.warn('Error parsing refresh token data:', parseError);
      }
    }

    // Intentar refrescar el token usando el backend
    try {
      const query = `
        mutation RefreshTokenProveedor($token: String!) {
          refreshTokenProveedor(token: $token) {
            token
            payload {
              id
              tipo_usuario
              proveedor_id
              estado
            }
          }
        }
      `;

      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { token },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.refreshTokenProveedor) {
          const newToken = data.data.refreshTokenProveedor.token;
          
          // Actualizar token en cookie y localStorage
          setAuthToken(newToken, TOKEN_EXPIRY_DAYS, AUTH_PROVEEDOR_COOKIE_NAME);
          
          const refreshTokenData = {
            token: newToken,
            expiresAt: new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
          };
          localStorage.setItem(REFRESH_PROVEEDOR_TOKEN_KEY, JSON.stringify(refreshTokenData));

          return newToken;
        }
      }
    } catch (error) {
      console.warn('Error refreshing token:', error);
    }

    return token;
  }

  /**
   * Cierra sesión de proveedor y limpia todos los datos
   */
  logout(): void {
    if (typeof window === 'undefined') return;

    removeAuthToken(AUTH_PROVEEDOR_COOKIE_NAME);
    localStorage.removeItem(REFRESH_PROVEEDOR_TOKEN_KEY);
    localStorage.removeItem('proveedor_user');
  }

  /**
   * Obtiene los headers de autenticación para proveedor
   */
  getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? getAuthToken(AUTH_PROVEEDOR_COOKIE_NAME) : undefined;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Valida si el token actual de proveedor es válido
   */
  async validateToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const token = getAuthToken(AUTH_PROVEEDOR_COOKIE_NAME);
    if (!token) return false;

    const userData = localStorage.getItem('proveedor_user');
    if (!userData) return false;

    // Verificar si el refresh token ha expirado
    const refreshTokenData = localStorage.getItem(REFRESH_PROVEEDOR_TOKEN_KEY);
    if (refreshTokenData) {
      try {
        const parsedData = JSON.parse(refreshTokenData);
        const { expiresAt } = parsedData;

        if (expiresAt && new Date(expiresAt) < new Date()) {
          return false;
        }
      } catch (parseError) {
        console.warn('Error parsing refresh token data:', parseError);
      }
    }

    // Verificar token con el backend
    try {
      const query = `
        mutation VerifyTokenProveedor($token: String!) {
          verifyTokenProveedor(token: $token) {
            id
            tipo_usuario
            proveedor_id
            estado
          }
        }
      `;

      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { token },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return !!data.data?.verifyTokenProveedor;
      }
    } catch (error) {
      console.warn('Error validating token:', error);
    }

    return false;
  }
}

// Exportar instancia singleton
export const authProveedorService = new AuthProveedorService();
