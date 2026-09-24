export interface Review {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
}
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  thumbnail: string;
  images: string[];
  brand?: string;
  sku?: string;
  reviews: Review[];
  warrantyInformation?: string;
  shippingInformation?: string;
  returnPolicy?: string;
}
export interface ProductPage {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}
export interface Category {
  slug: string;
  name: string;
}
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
}
export interface Workspace {
  added: Product[];
  updated: Record<string, Product>;
  deleted: number[];
}
export interface Query {
  page: number;
  size: number;
  q: string;
  category: string;
  sort: string;
  delay: number;
}
