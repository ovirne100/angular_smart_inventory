export interface Usuario {
  id: number;
  name: string;
  lastname: string;
  email: string;
  telephone?: string;      // opcional
  role_id?: number;        // opcional
  created_at?: string;
  updated_at?: string;
}
