import React, { useState } from "react";
import { Card, CardBody, CardFooter, Button, Radio, RadioGroup } from "@heroui/react";
import { Product } from "../types"; 
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext"; 
import { Icon } from "@iconify/react";

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const history = useNavigate();
  const { addToCart } = useCart();

  // Simpan pilihan ukuran per produk
  const [selectedSizes, setSelectedSizes] = useState<{ [productId: number]: "regular" | "large" }>({});

  const handleProductClick = (productId: number) => {
    history(`/product/${productId}`);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();

    const selectedSize = selectedSizes[product.id] || "regular";

    // Gabungkan data ukuran + harga ke cart
    addToCart(product, selectedSize);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        const selectedSize = selectedSizes[product.id] || "regular";
        const finalPrice =
          selectedSize === "large" && product.price_large
            ? product.price_large
            : product.price;

        return (
          <Card
            key={product.id}
            className="border border-default-200 cursor-pointer"
            onPress={() => handleProductClick(product.id)}
          >
            <CardBody className="p-0 overflow-hidden">
              <div className="relative">
                <img
                  src={
                    product.image_url ||
                    "https://placehold.co/300x256/e2e8f0/e2e8f0?text=No-Image"
                  }
                  alt={product.name}
                  className="w-full h-64 object-cover"
                />
              </div>
            </CardBody>
            <CardFooter className="flex flex-col items-start gap-3 p-4">
              <h3 className="font-semibold text-md">{product.name}</h3>
              <p className="text-xs text-default-500 line-clamp-2 h-8">
                {product.description}
              </p>

              {/* Radio group ukuran */}
              <RadioGroup
                orientation="horizontal"
                value={selectedSize}
                onValueChange={(val) =>
                  setSelectedSizes((prev) => ({
                    ...prev,
                    [product.id]: val as "regular" | "large",
                  }))
                }
              >
                <Radio value="regular">Regular</Radio>
                <Radio value="large" isDisabled={!product.price_large}>
                  Large
                </Radio>
              </RadioGroup>

              <div className="flex items-center justify-between w-full mt-2">
                <span className="font-bold">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(finalPrice)}
                </span>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  endContent={<Icon icon="lucide:shopping-cart" />}
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  Add
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
