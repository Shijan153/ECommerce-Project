import "./App.css";
import Navbar from "./Components/Navbar/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ShopCategory from "./Pages/ShopCategory";
import Shop from "./Pages/Shop";
import Product from "./Pages/Product";
import LoginSignup from "./Pages/LoginSignup";
import SellerAuth from "./Pages/SellerAuth"; // Import the combined component
import Cart from "./Pages/Cart";
import Footer from "./Components/Footer/Footer";
import men_banner from "./Components/Assets/banner_mens.png";
import women_banner from "./Components/Assets/banner_women.png";
import kid_banner from "./Components/Assets/banner_kids.png";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/men" element={<ShopCategory banner={men_banner} category="men" />} />
        <Route path="/women" element={<ShopCategory banner={women_banner} category="women" />} />
        <Route path="/kids" element={<ShopCategory banner={kid_banner} category="kids" />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        
        {/* Customer Auth */}
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/signup" element={<LoginSignup />} />
        
        {/* Seller Auth - Both login and signup use same component with toggle */}
        <Route path="/seller-login" element={<SellerAuth />} />
        <Route path="/seller-signup" element={<SellerAuth />} />

      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;