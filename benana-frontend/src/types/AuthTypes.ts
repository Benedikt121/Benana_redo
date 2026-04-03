export interface Credentials {
  username: string;
  clientPasswordHash: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface LogoutResponse {
  status: string;
  message: string;
}
