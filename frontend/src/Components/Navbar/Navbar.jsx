import React, { useContext, useState } from "react";
import "./Navbar.css";
import logo from "../Assets/logo.png";
import cart_icon from "../Assets/cart_icon.png";
import { Link } from "react-router-dom";
import { ShopContext } from "../../Context/ShopContext";

const Navbar = () => {

  const [menu,setMenu] = useState("shop");
  const { getTotalCartItems, sellerToken, sellerLogout } = useContext(ShopContext);

  return (
    <div className="navbar">

      <div className="nav-logo">
        <img src={logo} alt="" />
        <p>SHOPPER</p>
      </div>

      <ul className="nav-menu">
        <li onClick={()=>{setMenu("shop")}}>
          <Link style={{textDecoration:'none'}} to='/'>Shop</Link>
          {menu==="shop"?<hr/>:<></>}
        </li>

        <li onClick={()=>{setMenu("men")}}>
          <Link style={{textDecoration:'none'}} to='/men'>Men</Link>
          {menu==="men"?<hr/>:<></>}
        </li>

        <li onClick={()=>{setMenu("women")}}>
          <Link style={{textDecoration:'none'}} to='/women'>Women</Link>
          {menu==="women"?<hr/>:<></>}
        </li>

        <li onClick={()=>{setMenu("kids")}}>
          <Link style={{textDecoration:'none'}} to='/kids'>Kids</Link>
          {menu==="kids"?<hr/>:<></>}
        </li>

        <li onClick={()=>{setMenu("sports")}}>
          <Link style={{textDecoration:'none'}} to='/sports'>Sports</Link>
          {menu==="sports"?<hr/>:<></>}
        </li>

        <li onClick={()=>{setMenu("electronic devices")}}>
          <Link style={{textDecoration:'none'}} to='/electronicDevices'>Electronic Devices</Link>
          {menu==="electronic devices"?<hr/>:<></>}
        </li>
      </ul>

      <div className="nav-login-cart">

        {/* Customer Login */}
        <Link to='/login'>
          <button className="log-btn">Login</button>
        </Link>

        {/* Seller Section */}
        {sellerToken ? (
          <>
            <Link to='/seller-dashboard'>
              <button className="dashboard-btn">Dashboard</button>
            </Link>
            <button onClick={sellerLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <Link to='/seller-login'>
            <button className="seller-btn">Seller Login</button>
          </Link>
        )}

        {/* Cart */}
        <Link to='/cart'>
          <img src={cart_icon} alt="" />
        </Link>

        <div className="nav-cart-count">{getTotalCartItems()}</div>

      </div>

    </div>
  );
};

export default Navbar;