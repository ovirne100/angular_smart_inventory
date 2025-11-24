import { Producto } from "./producto";
import { Proveedor } from "./proveedor";
import { Usuario } from "./usuario";

export interface Entrada {
  id: number;
  product?: Producto;
  supplier?: Proveedor;
  user?: Usuario;
  quantity: number;
  unit?: string;
  lot?: string;
  inventory_id: number;
  ubicacion_interna: string;
  min_stock: number;
  date?: string;
  created_at?: string;
}
