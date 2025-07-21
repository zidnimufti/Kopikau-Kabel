import React from "react";
import {  Pagination } from "@heroui/react";
import { ProductGrid } from "../components/product-grid";
import { products } from "../data/product";
import { Routes, Route } from "react-router-dom";
import DefaultLayout from "@/layouts/default";

export default function ProductPage() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 100;
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);
  const totalPages = Math.ceil(products.length / itemsPerPage);
  
  return (
    <DefaultLayout>
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Routes>
        <Route 
        path=""
        element={
          <>
          <ProductGrid products={currentProducts} />
          
          <div className="flex justify-center mt-8">
            <Pagination
              total={totalPages}
              initialPage={1}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
            />
          </div>
          </>
        }
        />
      </Routes>
    </div>
    </DefaultLayout>
  );
}