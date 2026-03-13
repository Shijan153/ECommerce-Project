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
    const response = await fetch(`http://localhost:5000/api/products?category=${props.category}`);
    const data = await response.json();
    console.log('Product data:', data.data); // Check if image_url exists
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
    if (order === 'price-low') {
      sorted.sort((a, b) => a.product_price - b.product_price);
    } else if (order === 'price-high') {
      sorted.sort((a, b) => b.product_price - a.product_price);
    }
    setProducts(sorted);
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

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
        <div className="shopcategory-loadmore">Load More</div>
      )}
    </div>
  );
};

export default ShopCategory;