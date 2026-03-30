import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
import SellerAddProduct from '../Components/SellerAddProduct/SellerAddProduct';
import './CSS/SellerDashboard.css';

const StatusBadge = ({ status }) => (
  <span className={`seller-status-badge seller-status-${status}`}>
    {status?.replace('_', ' ')}
  </span>
);

const SellerDashboard = () => {
  const { sellerToken, sellerProducts, fetchSellerProducts, sellerLogout } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState('add');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('seller-token');

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/seller/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data.data || []);
      else setError(data.message || 'Failed to fetch orders');
    } catch {
      setError('Network error');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (sellerToken && !hasFetched.current) {
      hasFetched.current = true;
      fetchSellerProducts();
      fetchOrders();
    }
  }, [sellerToken]);

  const handleProductAdded = () => {
    fetchSellerProducts();
    setActiveTab('products');
  };

  const handleStatusChange = async (order_id, order_status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/seller/orders/${order_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ order_status })
      });
      const data = await res.json();
      if (res.ok) setOrders(prev => prev.map(o => o.order_id === order_id ? { ...o, order_status } : o));
      else setError(data.message);
    } catch { setError('Failed to update status'); }
  };

  const handleForwardToAdmin = async (order_id) => {
    if (!window.confirm('Forward this order to admin for delivery assignment?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/seller/orders/${order_id}/forward`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.order_id === order_id ? { ...o, forwarded_to_admin: true, order_status: 'confirmed' } : o
        ));
      } else setError(data.message);
    } catch { setError('Failed to forward order'); }
  };

  const handleLogout = () => {
    sellerLogout();
    navigate('/');
  };

  const parseSizes = (sizes) => {
    if (!sizes) return [];
    if (Array.isArray(sizes)) return sizes;
    try { return JSON.parse(sizes); } catch { return []; }
  };

  if (!sellerToken) return <div>Please login as seller</div>;

  return (
    <div className="seller-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h2>Seller Dashboard</h2>
          <p>Shopper</p>
        </div>

        <nav className="sidebar-nav">
          <button className={activeTab === 'add' ? 'active' : ''} onClick={() => setActiveTab('add')}>
            Add Product
          </button>
          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            My Products
          </button>
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            Orders
            {orders.filter(o => !o.forwarded_to_admin && o.order_status === 'pending').length > 0 && (
              <span className="order-badge">
                {orders.filter(o => !o.forwarded_to_admin && o.order_status === 'pending').length}
              </span>
            )}
          </button>
        </nav>

        <button className="seller-logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-content">
        {error && <div className="seller-error" onClick={() => setError('')}>{error} ✕</div>}

        {activeTab === 'add' && <SellerAddProduct onProductAdded={handleProductAdded} />}

        {activeTab === 'products' && (
          <div className="products-list">
            <h2>My Products</h2>
            <div className="products-grid">
              {sellerProducts && sellerProducts.length > 0 ? (
                sellerProducts.map(product => (
                  <div key={product.product_id} className="product-card">
                    <img
                      src={product.image_url || 'https://placehold.co/200x200?text=No+Image'}
                      alt={product.product_name}
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/200x200?text=No+Image';
                      }}
                    />
                    <h3>{product.product_name}</h3>
                    <p>Price: ${parseFloat(product.product_price).toFixed(2)}</p>
                    {product.old_price && parseFloat(product.old_price) > 0 && parseFloat(product.old_price) !== parseFloat(product.product_price) && (
                      <p style={{ textDecoration: 'line-through', color: '#888' }}>
                        Was: ${parseFloat(product.old_price).toFixed(2)}
                      </p>
                    )}
                    <p>Stock: {product.product_stock}</p>
                    <p>Category: {product.category_name}</p>
                    {parseSizes(product.sizes).length > 0 && (
                      <div className="product-sizes">
                        <span>Sizes: </span>
                        {parseSizes(product.sizes).map(size => (
                          <span key={size} className="size-tag">{size}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No products found. Add your first product!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="seller-orders">
            <div className="orders-header">
              <h2>My Orders</h2>
              <button className="refresh-btn" onClick={fetchOrders}>↻ Refresh</button>
            </div>
            {ordersLoading ? (
              <p className="loading-text">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="no-orders">No orders yet</p>
            ) : (
              <div className="orders-table-wrap">
                <table className="seller-orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th><th>Customer</th><th>Items</th>
                      <th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.order_id} className={order.forwarded_to_admin ? 'forwarded-row' : ''}>
                        <td><strong>#{order.order_id}</strong></td>
                        <td>
                          <div>{order.phone_number}</div>
                          <div className="order-address">{order.shipping_address?.substring(0, 35)}...</div>
                        </td>
                        <td>
                          <div className="order-items-list">
                            {order.items?.filter(i => i.product_id).map((item, idx) => (
                              <div key={idx} className="order-item-row">{item.product_name} × {item.quantity}</div>
                            ))}
                          </div>
                        </td>
                        <td><strong>${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                        <td>
                          <span className="payment-info">
                            {order.payment_method}<br />
                            <span className={`pay-status ${order.payment_status}`}>{order.payment_status}</span>
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={order.order_status} />
                          {order.forwarded_to_admin && <div className="forwarded-tag">✓ Sent to Admin</div>}
                        </td>
                        <td>
                          {!order.forwarded_to_admin ? (
                            <div className="action-buttons">
                              {order.order_status === 'pending' && (
                                <>
                                  <button className="confirm-btn" onClick={() => handleStatusChange(order.order_id, 'confirmed')}>Confirm</button>
                                  <button className="reject-btn" onClick={() => handleStatusChange(order.order_id, 'cancelled')}>Reject</button>
                                </>
                              )}
                              {order.order_status === 'confirmed' && (
                                <button className="forward-btn" onClick={() => handleForwardToAdmin(order.order_id)}>Forward to Admin</button>
                              )}
                            </div>
                          ) : (
                            <span className="done-text">Awaiting delivery</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;