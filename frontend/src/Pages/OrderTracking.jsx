import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../Context/ShopContext';
import { useNavigate } from 'react-router-dom';
import './CSS/OrderTracking.css';

const STATUS_STEPS = ['pending', 'confirmed', 'sent_seller_wh', 'sent_customer_wh', 'assigned', 'picked', 'on_the_way', 'delivered'];

const STATUS_INFO = {
  pending:    { label: 'Order Placed',     icon: '📦', color: '#f59e0b' },
  confirmed:  { label: 'Confirmed',        icon: '✅', color: '#3b82f6' },
  sent_seller_wh: { label: 'Sent to Seller Warehouse', icon: '🏭', color: '#8b5cf6' },
  sent_customer_wh: { label: 'Sent to Customer Warehouse', icon: '🚚', color: '#f97316' },
  assigned:   { label: 'Delivery Assigned',icon: '🚴', color: '#8b5cf6' },
  picked:     { label: 'Picked Up',        icon: '📬', color: '#f97316' },
  on_the_way: { label: 'On The Way',       icon: '🛵', color: '#06b6d4' },
  delivered:  { label: 'Delivered',        icon: '🎉', color: '#16a34a' },
  cancelled:  { label: 'Cancelled',        icon: '❌', color: '#dc2626' },
};

const OrderTracking = () => {
  const { token } = useContext(ShopContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, description: '' });
  const [productReviews, setProductReviews] = useState({});

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchOrders();
  }, [token]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders/my-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data.data || []);
      else setError(data.message || 'Failed to fetch orders');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const getStepIndex = (status) => STATUS_STEPS.indexOf(status);

  const toggleExpand = (order_id) => {
    setExpandedOrder(prev => prev === order_id ? null : order_id);
  };

  const fetchProductReviews = async (product_id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/product/${product_id}`);
      const data = await res.json();
      if (res.ok) setProductReviews(prev => ({ ...prev, [product_id]: data.data || [] }));
    } catch (err) {
      console.error('Error fetching product reviews:', err);
    }
  };

  const handleReviewItem = (item) => {
    setReviewingItem(item);
    setReviewForm({ rating: 0, description: '' });
  };

  const handleCancelReview = () => {
    setReviewingItem(null);
    setReviewForm({ rating: 0, description: '' });
  };

  const handleSubmitReview = async () => {
    if (!reviewingItem || reviewForm.rating === 0) return;
    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          product_id: reviewingItem.product_id,
          star: reviewForm.rating,
          description: reviewForm.description
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewingItem(null);
        setReviewForm({ rating: 0, description: '' });
        // refresh review list for this product
        if (reviewingItem?.product_id) fetchProductReviews(reviewingItem.product_id);
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch {
      setError('Failed to submit review');
    }
  };

  if (loading) return (
    <div className="ot-loading">
      <div className="ot-spinner"></div>
      <p>Loading your orders...</p>
    </div>
  );

  return (
    <div className="order-tracking-page">
      <div className="ot-header">
        <h1>My Orders</h1>
        <p>Track all your orders in real time</p>
      </div>

      {error && <div className="ot-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="ot-empty">
          <div className="ot-empty-icon">📦</div>
          <h2>No orders yet</h2>
          <p>Start shopping to see your orders here</p>
          <button onClick={() => navigate('/')}>Shop Now</button>
        </div>
      ) : (
        <div className="ot-orders-list">
          {orders.map(order => {
            console.log('Order details', order.order_id, order.shipping_address, order.phone_number, order.customer_address, order.customer_phone);
            const isCancelled = order.order_status === 'cancelled';
            const currentStep = getStepIndex(order.order_status);
            const statusInfo = STATUS_INFO[order.order_status] || STATUS_INFO.pending;
            const isExpanded = expandedOrder === order.order_id;

            return (
              <div key={order.order_id} className={`ot-order-card ${isCancelled ? 'cancelled' : ''}`}>
                {/* Order Header */}
                <div className="ot-order-header" onClick={() => toggleExpand(order.order_id)}>
                  <div className="ot-order-meta">
                    <span className="ot-order-id">Order #{order.order_id}</span>
                    <span className="ot-order-date">
                      {new Date(order.date).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="ot-order-right">
                    <span className="ot-amount">${parseFloat(order.total_amount).toFixed(2)}</span>
                    <span
                      className="ot-status-pill"
                      style={{ background: statusInfo.color + '20', color: statusInfo.color }}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                    <span className="ot-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {!isCancelled && (
                  <div className="ot-progress">
                    <div className="ot-steps-container">
                      {STATUS_STEPS.map((step, idx) => {
                        const info = STATUS_INFO[step];
                        const isCompleted = idx <= currentStep;
                        const isActive = idx === currentStep;
                        return (
                          <React.Fragment key={step}>
                            <div className={`ot-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                              <div className="ot-step-circle" style={isCompleted ? { background: info.color } : {}}>
                                {isCompleted ? info.icon : <span>{idx + 1}</span>}
                              </div>
                              <p className="ot-step-label">{info.label}</p>
                              {isActive && <div className="ot-active-indicator">Currently Here</div>}
                            </div>
                            {idx < STATUS_STEPS.length - 1 && (
                              <div className={`ot-step-line ${idx < currentStep ? 'completed' : ''}`}></div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="ot-order-details">
                    <div className="ot-details-grid">
                      <div className="ot-detail-section">
                        <h4>Order Info</h4>
                        <p><span>Transaction ID</span><strong>{order.tran_id}</strong></p>
                        <p><span>Payment</span><strong>{order.payment_method?.toUpperCase()} / {order.payment_status}</strong></p>
                        <p><span>Ship To</span><strong>{order.shipping_address || order.customer_address || 'Not provided'}</strong></p>
                        <p><span>Phone</span><strong>{order.phone_number || order.customer_phone || order.phone || 'Not provided'}</strong></p>
                        {order.order_notes && <p><span>Notes</span><strong>{order.order_notes}</strong></p>}
                      </div>

                      <div className="ot-detail-section">
                        <h4>Items</h4>
                        {order.items?.filter(i => i.product_id).map((item, idx) => (
                          <div key={idx} className="ot-item-row">
                            <img
                              src={item.image_url || 'https://placehold.co/50x50'}
                              alt={item.product_name}
                            />
                            <div>
                              <p>{item.product_name}</p>
                              <p>Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
                              {item.selected_size && <p className="ot-size">Size: {item.selected_size}</p>}
                              {order.order_status === 'delivered' && (
                              <>
                                <button className="ot-review-btn" onClick={() => {
                                  handleReviewItem(item);
                                  fetchProductReviews(item.product_id);
                                }}>
                                  Write Review
                                </button>
                                <button className="ot-review-btn" onClick={() => fetchProductReviews(item.product_id)}>
                                  Load Review Section
                                </button>
                              </>
                            )}

                            {productReviews[item.product_id] && productReviews[item.product_id].length > 0 && (
                              <div className="ot-local-review-section">
                                <h5>Reviews for {item.product_name}</h5>
                                {productReviews[item.product_id].map((rv, idx) => (
                                  <div key={idx} className="ot-local-review-card">
                                    <div><strong>{rv.customer_name || 'Anonymous'}</strong> ({new Date(rv.review_date).toLocaleDateString()})</div>
                                    <div>⭐ {rv.star} / 5</div>
                                    {rv.description && <div>{rv.description}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                            </div>
                            <strong>${(item.quantity * parseFloat(item.price)).toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Form */}
                    {reviewingItem && (
                      <div className="ot-review-form">
                        <h4>Review {reviewingItem.product_name}</h4>
                        <div className="ot-rating-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span
                              key={star}
                              className={star <= reviewForm.rating ? 'star filled' : 'star empty'}
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            >★</span>
                          ))}
                        </div>
                        <textarea
                          placeholder="Write your review..."
                          value={reviewForm.description}
                          onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
                          rows="3"
                        />
                        <div className="ot-review-buttons">
                          <button onClick={handleSubmitReview}>Submit Review</button>
                          <button onClick={handleCancelReview}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderTracking;