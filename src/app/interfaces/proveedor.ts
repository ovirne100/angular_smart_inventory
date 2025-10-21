<<<<<<< HEAD
export interface Supplier {
  supplier_id?: number;// 👈 agrega esto
  id?: number;
  name: string;
  tax_id?: string | null;
  address?: string;
  email?: string | null;
  phone?: string;
  status?: string;
=======
export interface Proveedor {
  id: number;
  name: string;
  tax_id: string;      // NIT/RUC/VAT ID
  address: string;
  email?: string;      // opcional
  phone: string;
  status: 'Active' | 'Inactive';
>>>>>>> 7b9678809b776d45ae469b0cbba53ab709774817
  created_at?: string;
  updated_at?: string;
}
