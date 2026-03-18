export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    phone?: string;
  };
  backend_tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
