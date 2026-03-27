import React, { useState, useEffect, useCallback } from 'react';
import './CSS/ShopCategory.css';
import dropdown_icon from '../Components/Assets/dropdown_icon.png';
import Item from '../Components/Item/Item';

const ShopCategory = (props) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('default');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Fetches products based on category from your Node.js/Postgres API
      const response = await fetch(`http://localhost:5000/api/products?category=${props.category}`);
      const data = await response.json();
      
      // Ensure we set the state using the 'data' array from your responseHandler
      setProducts(data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [props.category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const sortProducts = (order) => {
    setSortOrder(order);
    let sorted = [...products];
    
    // Using parseFloat because Postgres NUMERIC/DECIMAL types often arrive as strings
    if (order === 'price-low') {
      sorted.sort((a, b) => parseFloat(a.product_price) - parseFloat(b.product_price));
    } else if (order === 'price-high') {
      sorted.sort((a, b) => parseFloat(b.product_price) - parseFloat(a.product_price));
    }
    setProducts(sorted);
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="shop-category">
      <img
        className="shopcategory-banner"
        src={props.banner}
        alt={`${props.category} banner`}
      />

      <div className="shopcategory-indexSort">
        <p>
          <span>Showing 1-{Math.min(products.length, 12)}</span> out of {products.length} products
        </p>
        <div className="shopcategory-sort">
          <select
            value={sortOrder}
            onChange={(e) => sortProducts(e.target.value)}
            className="sort-select"
          >
            <option value="default">Sort by</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          <img src={dropdown_icon} alt="sort" />
        </div>
      </div>

      <div className="shopcategory-products">
        {products.length > 0 ? (
          products.map((item) => (
            <Item
              key={item.product_id}
              id={item.product_id}
              name={item.product_name}
              /* ✅ Corrected: Using the Cloudinary URL directly from the DB.
                 Since your DB stores 'https://res.cloudinary.com/...', 
                 prepending 'http://localhost:5000' would break the link.
              */
              image={item.image_url} 
              new_price={item.product_price}
              old_price={item.old_price}
            />
          ))
        ) : (
          <p className="no-products">No products found in this category</p>
        )}
      </div>

      {products.length > 12 && (
        <div className="shopcategory-loadmore">
          Explore More
        </div>
      )}
    </div>
  );
};

export default ShopCategory;