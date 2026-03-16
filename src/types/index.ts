export type UserRole = 'client' | 'manager' | 'driver' | 'management' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
