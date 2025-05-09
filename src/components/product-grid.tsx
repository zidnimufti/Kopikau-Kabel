import React from "react";
import { Card, CardBody, CardFooter, Chip } from "@heroui/react";
import { Product } from "../types/product";
import { useNavigate } from "react-router-dom";

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const history = useNavigate();

  const handleProductClick = (productId: number) => {
    history(`/product/${productId}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3x lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="border border-default-200"
          isHoverable
          isPressable
          onPress={() => handleProductClick(product.id)}
        >
          <CardBody className="p-0 overflow-hidden">
            <div className="relative">
              <img
                width={300}
                src={product.image}
                alt={product.name}
                className="w-full h-64 object-cover"
              />
              {product.isNew && (
                <Chip 
                  color="primary" 
                  variant="solid" 
                  className="absolute top-3 left-3"
                >
                  New
                </Chip>
              )}
              {product.discount > 0 && (
                <Chip 
                  color="danger" 
                  variant="solid" 
                  className="absolute top-3 right-3"
                >
                  {product.discount}% OFF
                </Chip>
              )}
              
            </div>
          </CardBody>
          <CardFooter className="flex flex-col items-start gap-2 p-4">
            <div className="flex items-center gap-1">
              <div className="flex">
              </div>
            </div>
            <h3 className="font-semibold text-md">{product.name}</h3>
            <p className="text-xs text-default-500 line-clamp-2">{product.description}</p>
            <div className="flex items-center justify-between w-full mt-2">
              <div className="flex items-center gap-1">
                {product.discount > 0 ? (
                  <>
                    <span className="font-bold text-danger">${product.discountedPrice}</span>
                    <span className="text-default-500 text-xs line-through">${product.price}</span>
                  </>
                ) : (
                  <span className="font-bold">{product.price}</span>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};