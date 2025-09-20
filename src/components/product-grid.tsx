import React, { useEffect, useState } from "react";
import { Card, CardBody, CardFooter, Button, Radio, RadioGroup, Chip } from "@heroui/react";
import { Product, Category } from "../types"; 
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext"; 
import { Icon } from "@iconify/react";
import { supabase } from "../api/supabaseClient";

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const history = useNavigate();
  const { addToCart } = useCart();

  const [selectedSizes, setSelectedSizes] = useState<{ [productId: number]: "regular" | "large" }>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Ambil data kategori dari Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*").order("id");
      if (error) {
        console.error("Error fetch categories:", error);
      } else {
        setCategories(data || []);
        if (data && data.length > 0) {
          // Default ke Coffee kalau ada
          const coffeeCat = data.find((c) => c.name.toLowerCase() === "coffee");
          if (coffeeCat) {
            setSelectedCategory(coffeeCat.id);
          } else {
            // Kalau Coffee tidak ada, ambil kategori pertama
            setSelectedCategory(data[0].id);
          }
        }
      }
    };
    fetchCategories();
  }, []);

  const handleProductClick = (productId: number) => {
    history(`/product/${productId}`);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const selectedSize = selectedSizes[product.id] || "regular";
    addToCart(product, selectedSize);
  };

  // Filter produk berdasarkan kategori
  const filteredProducts =
    selectedCategory === null
      ? []
      : products.filter((p) => p.category_id === selectedCategory);

  return (
    <div className="flex flex-col gap-6">
      {/* Tombol kategori */}
      <div className="flex justify-center gap-3 mt-10 flex-wrap">
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            color={selectedCategory === cat.id ? "primary" : "default"}
            variant={selectedCategory === cat.id ? "solid" : "flat"}
            onClick={() => setSelectedCategory(cat.id)}
            className="cursor-pointer"
          >
            {cat.name}
          </Chip>
        ))}
      </div>

      {/* Grid produk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const selectedSize = selectedSizes[product.id] || "regular";
          const basePrice =
            selectedSize === "large" && product.price_large
              ? product.price_large
              : product.price;
          
          const hasDiscount = product.discount !== null && product.discount > 0;
          const discountedPrice = hasDiscount
            ? Math.round(basePrice * (1 - (product.discount! / 100)))
            : basePrice;

          return (
            <Card
              key={product.id}
              className="border border-default-200 cursor-pointer"
              onPress={() => handleProductClick(product.id)}
            >
              <CardBody className="p-0 overflow-hidden">
                <div className="relative">
                  {hasDiscount && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                      -{product.discount}%
                    </span>
                  )}
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
                  <div className="flex flex-col">
                    {product.discount && (
                      <span className="text-xs text-red-400 line-through">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(basePrice)}
                      </span>
                    )}

                    <span
                      className={`font-bold ${
                        product.discount ? "text-green-500 text-lg" : "text-default-800"
                      }`}
                    >
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(product.discount ? discountedPrice : basePrice)}
                    </span>
                  </div>

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
    </div>
  );
};
