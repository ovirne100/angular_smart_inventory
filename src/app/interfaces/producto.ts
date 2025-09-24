export interface Producto {
  id?: number;
  category_id?: number;
  name: string;
  reference?: string;
  unit_of_measure?: string;
  batch: string;
  expiration_date?: string;

  icono1?: string;
  icono2?: string;
  icono3?: string;
}
