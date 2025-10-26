// src/app/interfaces/producto.ts
export interface Producto {
  id: number;
  name: string;
  batch: string;
  expiration_date: string | Date;  // permite string o Date
  reference?: string;
  unit_measurement?: string;
  category_id?: number;
  image?: string;
  pivot?: { supplier_id: number; product_id: number; unit_cost: string; supplier_reference?: string; batch: string };
  image_url?: string;
  categoria?: { name: string } | null;
}






// src/app/interfaces/proveedor.ts
export interface Proveedor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}
