import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import ProductPage from "@/pages/produk";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutHal from "@/pages/about";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ProductPage />} path="/produk/*" />
      <Route element={<PricingPage />} path="/pricing" />
      <Route element={<BlogPage />} path="/blog" />
      <Route element={<AboutHal />} path="/about" />
    </Routes>
  );
}

export default App;
