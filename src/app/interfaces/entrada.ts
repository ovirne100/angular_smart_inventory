import { Producto } from "./producto";
//import{proveedor} from "./proveedor";
export interface Entrada {
  id: number;
  product?: Producto;
//  supplier?: Proveedor;
 // user?: Usuario;
  quantity: number;
  unit?: string;
  lot?: string;
  inventory_id: number;
  date?: string;
  created_at?: string;
}
