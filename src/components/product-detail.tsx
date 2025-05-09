import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Chip, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Product } from "../types/product";
import DefaultLayout from "@/layouts/default";

interface ProductDetailProps {
  products: Product[];
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ products }) => {
  const { id } = useParams() as { id: string };
  const history = useNavigate();
  const productId = parseInt(id);
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return (
      <div>
        <Button 
          variant="flat" 
          startContent={<Icon icon="lucide:arrow-left" />}
          className="mb-6"
          onPress={() => history("/produk")}
        >
          Back to Products
        </Button>
        <Card className="shadow-md">
          <CardBody>
            <div className="text-center text-default-600 py-12">
              Product not found.
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <DefaultLayout>
    <div>
      <Button 
        variant="flat" 
        startContent={<Icon icon="lucide:arrow-left" />}
        className="mb-6"
        onPress={() => history("/produk")}
      >
        Back to Products
      </Button>
      
      <Card className="shadow-md">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-auto rounded-lg object-cover"
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
            
            <div className="flex flex-col">
              
              <div className="flex items-center gap-1 mt-2">
                <div className="flex">
                </div>
              </div>
              
              <div className="mt-4">
                {product.discount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-danger">${product.discountedPrice}</span>
                    <span className="text-xl text-default-500 line-through">${product.price}</span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold">{product.price}</span>
                )}
              </div>
              
              <p className="text-default-600 mt-6">{product.description}</p>
              
              <Divider className="my-6" />
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:check-circle" className="text-success" />
                  <span>{product.inStock ? "Barang Tersedia" : "Barang Habis"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:tag" className="text-default-500" />
                  <span>Category: {product.category}</span>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <Button 
                  color="primary" 
                  size="lg"
                  startContent={<Icon icon="lucide:shopping-cart" />}
                  className="flex-1"
                  onPress={() => { 
                    const phone = "6283824723739"; // Ganti dengan nomor WA tujuan (format internasional tanpa +)
                    const text = product.text;
                    const url = `https://wa.me/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`;
                    window.open(url, "_blank");}}
                >
                  Beli Sekarang
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
    </DefaultLayout>
  );
};