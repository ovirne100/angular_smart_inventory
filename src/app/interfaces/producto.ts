// src/app/interfaces/producto.ts

export interface LoteInventario {
  lot: string;
  expiration_date?: string | Date;
  cantidad?: number;
  fecha_entrada?: string | Date;
}

export interface Producto {
  id: number;
  name: string;
  batch: string;
  lote?: string;
  expiration_date: string | Date;  // permite string o Date
  codigo_de_barras?: string;
  reference?: string; // Mantener por compatibilidad
  unit_measurement?: string;
  category_id?: number;
  image?: string;
  pivot?: { supplier_id: number; product_id: number; unit_cost: string; supplier_reference?: string; batch: string };
  image_url?: string;
  categoria?: { name: string } | null;
  lotesInventario?: LoteInventario[]; // Lotes que están en el inventario (desde entradas)
}






// src/app/interfaces/proveedor.ts
export interface Proveedor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}
