export interface Producto {
  id?: number;
  category_id?: number;

  categoria?:{
    id: number;
    name: string;
  };

  name: string;
  reference?: string;
  unit_measurement?: string;
  batch: string;
  expiration_date?: string | Date | null;

  //image
  image?: string;
  image_url?: string | null;

  //para la tabla pivot
  pivot?: {
    supplier_id: number;
    product_id: number;
    unit_cost: string; // Laravel lo devuelve como string
    supplier_reference?: string | null;
  };

  //supplier
  supplier?: any; // Changed from Supplier to any to fix "Cannot find name 'Supplier'" error
  supplier_id?: number;
  supplier_name?: string;

}
