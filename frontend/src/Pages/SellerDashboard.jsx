import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../Context/ShopContext';
import SellerAddProduct from '../Components/SellerAddProduct/SellerAddProduct';
import './CSS/SellerDashboard.css';

const SellerDashboard = () => {
  const { sellerToken, sellerProducts, fetchSellerProducts } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState('add');

  useEffect(() => {
    if (sellerToken && activeTab === 'products') {
      fetchSellerProducts();
    }
  }, [activeTab, sellerToken, fetchSellerProducts]);

  if (!sellerToken) {
    return <div>Please login as seller</div>;
  }

  return (
    <div className="seller-dashboard">
      <div className="dashboard-sidebar">
        <h2>Seller Dashboard</h2>
        <button 
          className={activeTab === 'add' ? 'active' : ''}
          onClick={() => setActiveTab('add')}
        >
          Add Product
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          My Products
        </button>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'add' && <SellerAddProduct />}
        {activeTab === 'products' && (
          <div className="products-list">
            <h2>My Products</h2>
            <div className="products-grid">
              {sellerProducts && sellerProducts.length > 0 ? (
                sellerProducts.map(product => (
                  <div key={product.product_id} className="product-card">
                    <img src={product.image_url} alt={product.product_name} />
                    <h3>{product.product_name}</h3>
                    <p>Price: ${product.product_price}</p>
                    <p>Stock: {product.product_stock}</p>
                    <p>Category: {product.category_name}</p>
                  </div>
                ))
              ) : (
                <p>No products found. Add your first product!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;