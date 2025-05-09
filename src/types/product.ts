export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  discountedPrice: number;
  discount: number;
  image: string;
  category: string;
  isNew: boolean;
  inStock: boolean;
  text: string;
}