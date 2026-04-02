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
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ product_stock: '', sizes: [] });
  const [availableSizes, setAvailableSizes] = useState(['S', 'M', 'L', 'XL', 'XXL']);
  const [selectedSizes, setSelectedSizes] = useState({ S: false, M: false, L: false, XL: false, XXL: false });
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
      if (res.ok) {
        await fetchOrders(); // Refetch to ensure sync
      } else setError(data.message);
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
        await fetchOrders(); // Refetch to ensure sync
      } else setError(data.message);
    } catch { setError('Failed to forward order'); }
  };

  const handleSendToWarehouse = async (order_id) => {
    if (!window.confirm('Send this order to your warehouse?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/seller/orders/${order_id}/send-to-warehouse`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchOrders(); // Refetch to ensure sync
      } else setError(data.message);
    } catch { setError('Failed to send to warehouse'); }
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

  const isProductElectronics = (product) => {
    const category = (product?.category_name || product?.category || '').toLowerCase();
    return category === 'electronics';
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product.product_id);
    const isElectronics = isProductElectronics(product);
    const sizesArray = isElectronics ? [] : parseSizes(product.sizes);
    setEditForm({
      product_stock: product.product_stock || '',
      sizes: sizesArray
    });

    if (isElectronics) {
      setSelectedSizes({ S: false, M: false, L: false, XL: false, XXL: false });
    } else {
      const sizesStatus = { S: false, M: false, L: false, XL: false, XXL: false };
      sizesArray.forEach(size => {
        if (sizesStatus.hasOwnProperty(size)) {
          sizesStatus[size] = true;
        }
      });
      setSelectedSizes(sizesStatus);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditForm({ product_stock: '', sizes: [] });
  };

  const handleUpdateInventory = async () => {
    if (!editingProduct) return;
    try {
      const res = await fetch(`http://localhost:5000/api/seller/products/${editingProduct}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          product_stock: parseInt(editForm.product_stock) || 0,
          sizes: editForm.sizes
        })
      });
      const data = await res.json();
      if (res.ok) {
        fetchSellerProducts();
        setEditingProduct(null);
        setEditForm({ product_stock: '', sizes: [] });
      } else {
        setError(data.message || 'Failed to update inventory');
      }
    } catch {
      setError('Failed to update inventory');
    }
  };

  const handleSizeToggle = (size) => {
    setEditForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleAddCustomSize = () => {
    const customSize = prompt('Enter custom size:');
    if (customSize && customSize.trim() && !editForm.sizes.includes(customSize.trim())) {
      setEditForm(prev => ({
        ...prev,
        sizes: [...prev.sizes, customSize.trim()]
      }));
    }
  };

  const handleRemoveSize = (sizeToRemove) => {
    setEditForm(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== sizeToRemove)
    }));
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
                    {editingProduct === product.product_id ? (
                      <div className="edit-inventory-form">
                        <label>Stock:</label>
                        <input
                          type="number"
                          value={editForm.product_stock}
                          onChange={(e) => setEditForm({ ...editForm, product_stock: e.target.value })}
                          min="0"
                        />
                        {(!(!product.category_name && !product.category) && !isProductElectronics(product)) && (
                          <>
                            <label>Sizes:</label>
                            <div className="sizes-management">
                              <div className="available-sizes">
                                <p>Available Sizes:</p>
                                <div className="size-options">
                                  {availableSizes.map(size => (
                                    <label key={size} className="size-option">
                                      <input
                                        type="checkbox"
                                        checked={editForm.sizes.includes(size)}
                                        onChange={() => handleSizeToggle(size)}
                                      />
                                      {size}
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div className="custom-sizes">
                                <p>Selected Sizes:</p>
                                <div className="selected-sizes">
                                  {editForm.sizes.map(size => (
                                    <span key={size} className="selected-size-tag">
                                      {size}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSize(size)}
                                        className="remove-size-btn"
                                      >×</button>
                                    </span>
                                  ))}
                                </div>
                                <button type="button" onClick={handleAddCustomSize} className="add-custom-size-btn">
                                  + Add Custom Size
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="edit-buttons">
                          <button onClick={handleUpdateInventory}>Update</button>
                          <button onClick={handleCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                        <button className="edit-btn" onClick={() => handleEditProduct(product)}>Edit Inventory</button>
                      </>
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
                              <div key={idx} className="order-item-row">
                                {item.product_name} × {item.quantity}
                                {item.selected_size && <span className="item-size"> (Size: {item.selected_size})</span>}
                              </div>
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
                          {(order.order_status === 'sent_seller_wh' || order.order_status === 'forwarded_to_admin') && <div className="forwarded-tag">✓ Sent to Admin</div>}
                        </td>
                        <td>
                          {['pending','confirmed','sent_seller_wh','forwarded_to_admin'].includes(order.order_status) ? (
                            <div className="action-buttons">
                              {order.order_status === 'pending' && (
                                <>
                                  <button className="confirm-btn" onClick={() => handleStatusChange(order.order_id, 'confirmed')}>Confirm</button>
                                  <button className="reject-btn" onClick={() => handleStatusChange(order.order_id, 'cancelled')}>Reject</button>
                                </>
                              )}
                              {order.order_status === 'confirmed' && (
                                <button className="warehouse-btn" onClick={() => handleSendToWarehouse(order.order_id)}>Send to Warehouse</button>
                              )}
                            </div>
                          ) : (
                            <span className="done-text">Processing by Admin</span>
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