export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  phone?: string;
  vendor_id?: string;
  status: string;
};