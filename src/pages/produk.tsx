import { useState, useEffect } from "react";
import DefaultLayout from "@/layouts/default";
import { ProductGrid } from "@/components/product-grid"; // Sesuaikan path
import { getPublicProducts } from "@/api/publicApi"; // Sesuaikan path
import { Product } from "@/types"; // Sesuaikan path

const ProductPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getPublicProducts()
            .then(data => {
                setProducts(data || []);
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <DefaultLayout><div>Loading products...</div></DefaultLayout>;
    }

    if (error) {
        return <DefaultLayout><div>Error: {error}</div></DefaultLayout>;
    }

    return (
        <DefaultLayout>
            <ProductGrid products={products} />
        </DefaultLayout>
    );
};

export default ProductPage;