export interface Supplier {
  supplier_id?: number;// 👈 agrega esto
  id?: number;
  name: string;
  tax_id?: string | null;
  address?: string;
  email?: string | null;
  phone?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
