import { Producto } from "./producto";

export interface Salida {
  id: number;
  product?: Producto;
 // user?: Usuario;
  quantity: number;
  unit?: string;
  lot?: string;
  inventory_id: number;
  created_at?: string;
}
