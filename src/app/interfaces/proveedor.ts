export interface Proveedor {
  id: number;
  name: string;
  tax_id: string;      // NIT/RUC/VAT ID
  address: string;
  email?: string;      // opcional
  phone: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}
