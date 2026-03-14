import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './CSS/OrderConfirmation.css';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tran_id = searchParams.get('tran_id');
  const status = searchParams.get('status');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${tran_id}`);
        const data = await response.json();
        setOrder(data.data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tran_id) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [tran_id]);

  if (loading) return <div className="confirmation-loading">Loading order details...</div>;

  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className={`confirmation-icon ${isSuccess ? 'success' : 'failed'}`}>
          {isSuccess ? '✓' : isCancelled ? '✕' : '!'}
        </div>

        <h1 className={`confirmation-title ${isSuccess ? 'success' : 'failed'}`}>
          {isSuccess
            ? 'Order Placed Successfully!'
            : isCancelled
            ? 'Payment Cancelled'
            : 'Payment Failed'}
        </h1>

        <p className="confirmation-subtitle">
          {isSuccess
            ? 'Thank you for your order. We will process it shortly.'
            : isCancelled
            ? 'Your payment was cancelled. Your order has not been placed.'
            : 'Something went wrong with your payment. Please try again.'}
        </p>

        {order && isSuccess && (
          <div className="confirmation-details">
            <div className="confirmation-info">
              <div className="info-row">
                <span>Order ID</span>
                <strong>#{order.order_id}</strong>
              </div>
              <div className="info-row">
                <span>Transaction ID</span>
                <strong>{order.tran_id}</strong>
              </div>
              <div className="info-row">
                <span>Payment Method</span>
                <strong>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'SSLCommerz'}</strong>
              </div>
              <div className="info-row">
                <span>Payment Status</span>
                <strong className={`status-badge ${order.payment_status}`}>
                  {order.payment_status}
                </strong>
              </div>
              <div className="info-row">
                <span>Shipping To</span>
                <strong>{order.shipping_address}</strong>
              </div>
              <div className="info-row total">
                <span>Total Amount</span>
                <strong>${parseFloat(order.total_amount).toFixed(2)}</strong>
              </div>
            </div>

            {order.items && order.items[0]?.product_id && (
              <div className="confirmation-items">
                <h3>Items Ordered</h3>
                {order.items.map((item, index) => (
                  <div key={index} className="confirmation-item">
                    <img
                      src={item.image_url ? `http://localhost:5000${item.image_url}` : 'https://placehold.co/50x50'}
                      alt={item.product_name}
                    />
                    <div>
                      <p>{item.product_name}</p>
                      <p>Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <strong>${(item.quantity * parseFloat(item.price)).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="confirmation-actions">
          <button className="btn-primary" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
          {!isSuccess && (
            <button className="btn-secondary" onClick={() => navigate('/cart')}>
              Back to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;