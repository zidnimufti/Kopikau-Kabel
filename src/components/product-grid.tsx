import React from "react";
import { Card, CardBody, CardFooter, Button } from "@heroui/react";
import { Product } from "../types"; // Menggunakan tipe Product yang benar dari /types/index.ts
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext"; // Sesuaikan path
import { Icon } from "@iconify/react";

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const history = useNavigate();
  const { addToCart } = useCart();

  const handleProductClick = (productId: number) => {
    history(`/product/${productId}`);
  };
  
  // FIX: Mengubah tipe event menjadi React.MouseEvent yang standar.
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Sekarang ini akan berfungsi dengan benar.
    addToCart(product);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="border border-default-200 cursor-pointer" // Tambahkan cursor-pointer untuk menandakan bisa diklik
          onPress={() => handleProductClick(product.id)}
        >
          <CardBody className="p-0 overflow-hidden">
            <div className="relative">
              <img
                src={product.image_url || 'https://placehold.co/300x256/e2e8f0/e2e8f0?text=No-Image'}
                alt={product.name}
                className="w-full h-64 object-cover"
              />
            </div>
          </CardBody>
          <CardFooter className="flex flex-col items-start gap-2 p-4">
            <h3 className="font-semibold text-md">{product.name}</h3>
            <p className="text-xs text-default-500 line-clamp-2 h-8">{product.description}</p>
            <div className="flex items-center justify-between w-full mt-2">
              <span className="font-bold">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price)}
              </span>
              <Button 
                size="sm" 
                color="primary"
                variant="flat"
                endContent={<Icon icon="lucide:shopping-cart" />}
                // FIX: Mengganti onPress dengan onClick standar React.
                onClick={(e) => handleAddToCart(e, product)} >
                Add
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
