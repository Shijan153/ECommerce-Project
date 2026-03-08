import React, { createContext, useState } from "react";
import all_product from "../Components/Assets/all_product";

export const ShopContext = createContext(null);

const getDefaultCart = ()=>{
    let cart={};
    for(let index=0;index<all_product.length+1;index++){
      cart[index]=0;
    }
    return cart;
}

const ShopContextProvider = (props) => {
  const [cartItems,setCartItems]=useState(getDefaultCart());
  const [sellerToken, setSellerToken] = useState(localStorage.getItem('seller-token'));
  const [sellerProducts, setSellerProducts] = useState([]);
  
  const addToCart=(itemId)=>{
    setCartItems((prev)=>({...prev,[itemId]:prev[itemId]+1}))
    console.log(cartItems);
  }
  
  const removeFromCart=(itemId)=>{
    setCartItems((prev)=>({...prev,[itemId]:prev[itemId]-1}))
  }

  const getTotalCartAmount=()=>{
    let totalAmount=0;
    for(const item in cartItems){
      if(cartItems[item]>0){
        let itemInfo=all_product.find((product)=>product.id===Number(item));
        totalAmount+=itemInfo.new_price* cartItems[item];
      }    
    }
    return totalAmount;
  }

  const getTotalCartItems=()=>{
    let totalItem=0;
    for(const item in cartItems)
    {
      if(cartItems[item]>0)
      {
        totalItem+=cartItems[item];
      }
    }
    return totalItem;
  }

  const fetchSellerProducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/seller/products', {
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        }
      });
      const data = await response.json();
      setSellerProducts(data);
    } catch (error) {
      console.error('Error fetching seller products:', error);
    }
  };

  const sellerLogin = async (email, password) => {
    try {
      const response = await fetch('http://localhost:4000/seller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('seller-token', data.token);
        setSellerToken(data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const sellerLogout = () => {
    localStorage.removeItem('seller-token');
    setSellerToken(null);
    setSellerProducts([]);
  };

  const contextValue = {
    getTotalCartItems,
    getTotalCartAmount, 
    all_product,
    cartItems,
    addToCart,
    removeFromCart,
    sellerToken,
    sellerProducts,
    fetchSellerProducts,
    sellerLogin,
    sellerLogout
  };
  
  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
}

export default ShopContextProvider;