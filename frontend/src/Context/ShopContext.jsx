import React, { createContext, useState, useEffect, useCallback, useRef } from "react";

export const ShopContext = createContext(null);

const ShopContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [cartSizes, setCartSizes] = useState({});
  const [token, setToken] = useState(null); // Start with null instead of localStorage
  const [sellerToken, setSellerToken] = useState(null); // Start with null instead of localStorage
  const [sellerProducts, setSellerProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const syncTimeout = useRef(null);

  // Clear all authentication tokens on app initialization
  useEffect(() => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('seller-token');
    localStorage.removeItem('admin-token');
    localStorage.removeItem('delivery-token');
    console.log('All authentication tokens cleared - app initialized in logout state');
  }, []);

  useEffect(() => { fetchAllProducts(); }, []);

  useEffect(() => {
    if (token) fetchCartFromDB(token);
    else setCartItems({});
  }, [token]);

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setAllProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCartFromDB = async (authToken) => {
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (data.data?.items?.length > 0) {
        const restored = {};
        const restoredSizes = {};
        data.data.items.forEach(item => {
          if (item.quantity > 0) {
            restored[item.product_id] = item.quantity;
            if (item.selected_size) restoredSizes[item.product_id] = item.selected_size;
          }
        });
        setCartItems(restored);
        setCartSizes(restoredSizes);
      }
    } catch (error) {
      console.error('Error fetching cart from DB:', error);
    }
  };

  const syncCartToDB = useCallback((updatedCart, updatedSizes) => {
    const authToken = localStorage.getItem('auth-token');
    if (!authToken) return;
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(async () => {
      try {
        const items = Object.keys(updatedCart)
          .filter(id => updatedCart[id] > 0)
          .map(id => {
            const product = allProducts.find(p => p.product_id === Number(id));
            return {
              product_id: Number(id),
              quantity: updatedCart[id],
              price: product ? parseFloat(product.product_price) : 0,
              selected_size: updatedSizes[id] || null
            };
          });
        const total_amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await fetch('http://localhost:5000/api/cart/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ items, total_amount: total_amount.toFixed(2) })
        });
      } catch (error) {
        console.error('Error syncing cart:', error);
      }
    }, 500);
  }, [allProducts]);

  const addToCart = (itemId, size = '') => {
    setCartItems(prev => {
      const updated = { ...prev, [itemId]: (prev[itemId] || 0) + 1 };
      const updatedSizes = size ? { ...cartSizes, [itemId]: size } : cartSizes;
      if (size) setCartSizes(updatedSizes);
      syncCartToDB(updated, size ? updatedSizes : cartSizes);
      return updated;
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const updated = { ...prev, [itemId]: Math.max((prev[itemId] || 0) - 1, 0) };
      syncCartToDB(updated, cartSizes);
      return updated;
    });
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = allProducts.find(p => p.product_id === Number(item));
        if (itemInfo) totalAmount += parseFloat(itemInfo.product_price) * cartItems[item];
      }
    }
    return totalAmount.toFixed(2);
  };

  const getTotalCartItems = () => {
    let totalItem = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) totalItem += cartItems[item];
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
        const authToken = data.data?.token || data.token;
        localStorage.setItem('auth-token', authToken);
        setToken(authToken);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch { return { success: false, message: 'Network error' }; }
  };

  const customerSignup = async (name, mobile, email, password, house_no, street, postal_code, city_id) => {
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mobile,
          email,
          password,
          house_no,
          street,
          postal_code,
          city_id: city_id ? parseInt(city_id) : null
        })
      });
      const data = await response.json();
      if (response.ok) return { success: true };
      return { success: false, message: data.message };
    } catch {
      return { success: false, message: 'Network error' };
    }
  };

  const customerLogout = () => {
    localStorage.removeItem('auth-token');
    setToken(null);
    setCartItems({});
    setCartSizes({});
  };

  const fetchSellerProducts = async () => {
    try {
      const sToken = localStorage.getItem('seller-token');
      const response = await fetch('http://localhost:5000/api/seller/products', {
        headers: { 'Authorization': `Bearer ${sToken}` }
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
      if (response.ok) {
        const sToken = data.data?.token || data.token;
        if (sToken) {
          localStorage.setItem('seller-token', sToken);
          setSellerToken(sToken);
          return { success: true };
        }
        return { success: false, message: 'No token received from server' };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch {
      return { success: false, message: 'Network error' };
    }
  };

  // FIX: Parameter order now matches SellerAuth.jsx call:
  // sellerSignup(name, phone, email, password, storeName, house_no, street, postal_code, city_id)
  // Also sends all address fields to the backend.
  const sellerSignup = async (name, phone, email, password, storeName, house_no, street, postal_code, city_id) => {
    try {
      const response = await fetch('http://localhost:5000/api/sellersignup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone_no: phone,
          email,
          password,
          store_name: storeName,
          house_no,
          street,
          postal_code,
          city_id: city_id ? parseInt(city_id) : null
        })
      });
      const data = await response.json();
      if (response.ok) {
        const sToken = data.data?.token || data.token;
        if (sToken) {
          localStorage.setItem('seller-token', sToken);
          setSellerToken(sToken);
        }
        return { success: true };
      }
      return { success: false, message: data.message || 'Signup failed' };
    } catch {
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
    allProducts,
    cartItems,
    cartSizes,
    setCartItems,
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