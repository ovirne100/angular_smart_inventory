export interface Alert {
  id: number;
  inventory: {
    product: {
      id: number;
      name: string;
    };
  };
  alert_type?: 'low_stock' | 'out_of_stock'|string;
  status: 'active' | 'resolved' | string;
  message: string;
  date: string;
  created_at?: string;
  resolved_at?: string | null; // permite null
    lot?: string | null;       // ✅ agregar esto
    reference?: string | null; // ✅ agregar esto
}
