export interface Credentials {
  username: string;
  clientPasswordHash: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  token: string;
  user: AuthUser;
}

export interface LogoutResponse {
  status: string;
  message: string;
}

export interface AuthUser {
  id: string;
  username: string;
}
