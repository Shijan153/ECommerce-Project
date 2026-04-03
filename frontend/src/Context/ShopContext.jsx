import React, { createContext, useState, useEffect, useCallback, useRef } from "react";

export const ShopContext = createContext(null);

const ShopContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState(null);
  const [sellerToken, setSellerToken] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const syncTimeout = useRef(null);

  useEffect(() => { fetchAllProducts(); }, []);

  useEffect(() => {
    if (token) {
      fetchCartFromDB(token);
      fetchUserData(token);
    } else {
      setCartItems({});
      setUserData(null);
    }
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

  const makeCartKey = (productId, size = '') => `${productId}:${size || ''}`;
  const parseCartKey = (key) => {
    const [product_id, selected_size] = key.split(':');
    return { product_id: Number(product_id), selected_size: selected_size || '' };
  };

  const fetchCartFromDB = async (authToken) => {
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (data.data?.items?.length > 0) {
        const restored = {};
        data.data.items.forEach(item => {
          if (item.quantity > 0) {
            const key = makeCartKey(item.product_id, item.selected_size || '');
            restored[key] = (restored[key] || 0) + item.quantity;
          }
        });
        setCartItems(restored);
      }
    } catch (error) {
      console.error('Error fetching cart from DB:', error);
    }
  };

  const fetchUserData = async (authToken) => {
    if (!authToken) {
      setUserData(null);
      return;
    }

    setUserDataLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      console.debug('fetchUserData status', response.status, 'token', authToken, 'data', data);
      if (response.ok) {
        setUserData(data.data || null);
      } else {
        setUserData(null);
        if (response.status === 401) {
          localStorage.removeItem('auth-token');
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    } finally {
      setUserDataLoading(false);
    }
  };

  const syncCartToDB = useCallback((updatedCart) => {
    const authToken = localStorage.getItem('auth-token');
    if (!authToken) return;
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(async () => {
      try {
        const items = Object.entries(updatedCart)
          .filter(([, quantity]) => quantity > 0)
          .map(([key, quantity]) => {
            const { product_id, selected_size } = parseCartKey(key);
            const product = allProducts.find(p => p.product_id === Number(product_id));
            return {
              product_id: Number(product_id),
              quantity,
              price: product ? parseFloat(product.product_price) : 0,
              selected_size: selected_size || null
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
    const key = makeCartKey(itemId, size);
    setCartItems(prev => {
      const updated = { ...prev, [key]: (prev[key] || 0) + 1 };
      syncCartToDB(updated);
      return updated;
    });
  };

  const removeFromCart = (itemId, size = '') => {
    const key = makeCartKey(itemId, size);
    setCartItems(prev => {
      const updatedQuantity = Math.max((prev[key] || 0) - 1, 0);
      const updated = { ...prev };
      if (updatedQuantity === 0) delete updated[key];
      else updated[key] = updatedQuantity;
      syncCartToDB(updated);
      return updated;
    });
  };

  const increment = (itemId, size = '') => {
    addToCart(itemId, size);
  };

  const decrement = (itemId, size = '') => {
    removeFromCart(itemId, size);
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    Object.entries(cartItems).forEach(([key, quantity]) => {
      if (quantity > 0) {
        const { product_id } = parseCartKey(key);
        const itemInfo = allProducts.find(p => p.product_id === Number(product_id));
        if (itemInfo) totalAmount += parseFloat(itemInfo.product_price) * quantity;
      }
    });
    return totalAmount.toFixed(2);
  };

  const getTotalCartItems = () => {
    let totalItem = 0;
    Object.values(cartItems).forEach(quantity => {
      if (quantity > 0) totalItem += quantity;
    });
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

  const updateUserProfile = async (mobile, house_no, street, postal_code, city_id) => {
    try {
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mobile,
          house_no,
          street,
          postal_code,
          city_id: city_id ? parseInt(city_id) : null
        })
      });
      const data = await response.json();
      if (response.ok) {
        setUserData(data.data);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch {
      return { success: false, message: 'Network error' };
    }
  };

  const customerLogout = () => {
    localStorage.removeItem('auth-token');
    setToken(null);
    setCartItems({});
    setUserData(null);
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
    setCartItems,
    addToCart,
    removeFromCart,
    increment,
    decrement,
    token,
    sellerToken,
    sellerProducts,
    userDataLoading,
    userData,
    customerLogin,
    customerSignup,
    updateUserProfile,
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