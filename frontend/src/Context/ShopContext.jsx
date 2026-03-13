import React, { createContext, useState, useEffect } from "react";

export const ShopContext = createContext(null);

const ShopContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState(localStorage.getItem('auth-token'));
  const [sellerToken, setSellerToken] = useState(localStorage.getItem('seller-token'));
  const [sellerProducts, setSellerProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setAllProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    console.log('Seller token in context:', sellerToken);
  }, [sellerToken]);

  const addToCart = (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: Math.max((prev[itemId] || 0) - 1, 0)
    }));
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = allProducts.find((product) => product.product_id === Number(item));
        if (itemInfo) {
          totalAmount += itemInfo.product_price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => {
    let totalItem = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        totalItem += cartItems[item];
      }
    }
    return totalItem;
  };

  const customerLogin = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok) {
        const token = data.data?.token || data.token;
        localStorage.setItem('auth-token', token);
        setToken(token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const customerSignup = async (name, mobile, email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, email, password })
      });

      const data = await response.json();
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const customerLogout = () => {
    localStorage.removeItem('auth-token');
    setToken(null);
  };

  const fetchSellerProducts = async () => {
    try {
      const token = localStorage.getItem('seller-token');
      const response = await fetch('http://localhost:5000/api/seller/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSellerProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching seller products:', error);
    }
  };

  const sellerLogin = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/sellerlogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        const token = data.data?.token || data.token;
        if (token) {
          localStorage.setItem('seller-token', token);
          setSellerToken(token);
          return { success: true };
        } else {
          return { success: false, message: 'No token in response' };
        }
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const sellerSignup = async (storeName, email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/sellersignup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, email, password })
      });

      const data = await response.json();
      if (response.ok) {
        const token = data.data?.token || data.token;
        localStorage.setItem('seller-token', token);
        setSellerToken(token);
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
    all_product: allProducts,
    cartItems,
    addToCart,
    removeFromCart,
    token,
    sellerToken,
    sellerProducts,
    customerLogin,
    customerSignup,
    customerLogout,
    fetchSellerProducts,
    sellerLogin,
    sellerSignup,
    sellerLogout
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;