export type UserRole = 'admin' | 'reception' | 'doctor' | 'billing';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
