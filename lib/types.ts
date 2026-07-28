export interface User {
  id: string;
  email: string;
}

export interface Store {
  id: string;
  name: string;
  description: string;
  user_id: string;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  store_id: string;
  category_id?: string | null;
  images?: string[];
  likes?: number;
  reviews_count?: number;
  created_at?: string;
}