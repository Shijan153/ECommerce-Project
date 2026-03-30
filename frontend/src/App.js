import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import Shop from './Pages/Shop';
import ShopCategory from './Pages/ShopCategory';
import Product from './Pages/Product';
import Cart from './Pages/Cart';
import LoginSignup from './Pages/LoginSignup';
import SellerAuth from './Pages/SellerAuth';
import SellerDashboard from './Pages/SellerDashboard';
import Checkout from './Pages/Checkout';
import OrderConfirmation from './Pages/OrderConfirmation';
import AdminAuth from './Pages/AdminAuth';
import AdminPanel from './Pages/AdminPanel';
import DeliveryAuth from './Pages/DeliveryAuth';
import DeliveryDashboard from './Pages/DeliveryDashboard';
import OrderTracking from './Pages/OrderTracking';
import SearchResults from './Pages/SearchResults';   // ← NEW

import men_banner from './Components/Assets/banner_mens.png';
import women_banner from './Components/Assets/banner_women.png';
import kids_banner from './Components/Assets/banner_kids.png';

const Layout = () => {
  const location = useLocation();

  const adminToken = localStorage.getItem("admin-token");
  const deliveryToken = localStorage.getItem("delivery-token");
  const sellerToken = localStorage.getItem("seller-token");

  const isSellerDashboard = location.pathname.startsWith('/seller-dashboard') && sellerToken;
  const isAdminPanel = location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/admin-login') &&
    !location.pathname.startsWith('/admin-register') &&
    adminToken;
  const isDeliveryDashboard = location.pathname.startsWith('/delivery-dashboard') && deliveryToken;

  const hideNavbar = isSellerDashboard || isAdminPanel || isDeliveryDashboard;

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path='/' element={<Shop />} />
        <Route path='/men' element={<ShopCategory category="men" banner={men_banner} />} />
        <Route path='/women' element={<ShopCategory category="women" banner={women_banner} />} />
        <Route path='/kids' element={<ShopCategory category="kids" banner={kids_banner} />} />
        <Route path='/sports' element={<ShopCategory category="sports" banner={men_banner} />} />
        <Route path='/electronicDevices' element={<ShopCategory category="electronics" banner={men_banner} />} />
        <Route path='/product/:productId' element={<Product />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/login' element={<LoginSignup mode="login" />} />
        <Route path='/signup' element={<LoginSignup mode="signup" />} />
        <Route path='/seller-login' element={<SellerAuth />} />
        <Route path='/seller-signup' element={<SellerAuth />} />
        <Route path='/seller-dashboard' element={<SellerDashboard />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/order-confirmation' element={<OrderConfirmation />} />
        <Route path='/admin-login' element={<AdminAuth />} />
        <Route path='/admin-register' element={<AdminAuth />} />
        <Route path='/admin' element={<AdminPanel />} />
        <Route path='/delivery-login' element={<DeliveryAuth />} />
        <Route path='/delivery-register' element={<DeliveryAuth />} />
        <Route path='/delivery-dashboard' element={<DeliveryDashboard />} />
        <Route path='/my-orders' element={<OrderTracking />} />
        <Route path='/search' element={<SearchResults />} />  {/* ← NEW */}
      </Routes>
      {!hideNavbar && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
};

export default App;
