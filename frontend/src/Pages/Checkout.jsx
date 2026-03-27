import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
import './CSS/Checkout.css';

const Checkout = () => {
  const { cartItems, cartSizes, allProducts, setCartItems } = useContext(ShopContext);
  const token = useContext(ShopContext).token || localStorage.getItem('auth-token');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shipping_address: '',
    phone_number: '',
    promo_code: '',
    order_notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  const cartProductList = (allProducts || []).filter(
    p => cartItems[p.product_id] > 0
  );

  const subtotal = cartProductList.reduce((sum, p) => {
    return sum + (parseFloat(p.product_price) * cartItems[p.product_id]);
  }, 0);

  const total = Math.max(subtotal - discount, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const applyPromo = () => {
    if (form.promo_code === 'SAVE10') {
      setDiscount(subtotal * 0.1);
      setPromoApplied(true);
      setError('');
    } else {
      setError('Invalid promo code');
      setPromoApplied(false);
      setDiscount(0);
    }
  };

  const buildOrderItems = () => {
    return cartProductList.map(p => ({
      product_id: p.product_id,
      quantity: cartItems[p.product_id],
      price: parseFloat(p.product_price),
      selected_size: cartSizes?.[p.product_id] || null
    }));
  };

  const handlePlaceOrder = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!form.shipping_address.trim()) {
      setError('Shipping address is required');
      return;
    }
    if (!form.phone_number.trim()) {
      setError('Phone number is required');
      return;
    }
    if (cartProductList.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = paymentMethod === 'sslcommerz'
        ? 'http://localhost:5000/api/orders/ssl/init'
        : 'http://localhost:5000/api/orders/cod';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shipping_address: form.shipping_address,
          phone_number: form.phone_number,
          order_notes: form.order_notes,
          total_amount: total.toFixed(2),
          items: buildOrderItems()
        })
      });

      const data = await response.json();
      console.log('Order response:', data);

      if (response.ok) {
        if (paymentMethod === 'sslcommerz') {
          window.location.href = data.data.payment_url;
        } else {
          if (setCartItems) setCartItems({});
          navigate(`/order-confirmation?tran_id=${data.data.tran_id}&status=success`);
        }
      } else {
        setError(data.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-left">
          <h2 className="checkout-title">Checkout</h2>

          <div className="checkout-section">
            <h3>Shipping Information</h3>
            <div className="form-group">
              <label>Shipping Address *</label>
              <textarea
                name="shipping_address"
                value={form.shipping_address}
                onChange={handleChange}
                placeholder="House no, Road no, Area, City"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="+880 1XXXXXXXXX"
              />
            </div>
            <div className="form-group">
              <label>Order Notes (Optional)</label>
              <textarea
                name="order_notes"
                value={form.order_notes}
                onChange={handleChange}
                placeholder="Any special instructions..."
                rows={2}
              />
            </div>
          </div>

          <div className="checkout-section">
            <h3>Promo Code</h3>
            <div className="promo-row">
              <input
                type="text"
                name="promo_code"
                value={form.promo_code}
                onChange={handleChange}
                placeholder="Enter promo code"
              />
              <button className="promo-btn" onClick={applyPromo}>Apply</button>
            </div>
            {promoApplied && (
              <p className="promo-success">Promo applied! You saved ${discount.toFixed(2)}</p>
            )}
          </div>

          <div className="checkout-section">
            <h3>Payment Method</h3>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <div className="payment-option-content">
                  <span className="payment-icon">💵</span>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when your order arrives</p>
                  </div>
                </div>
              </label>

              <label className={`payment-option ${paymentMethod === 'sslcommerz' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="sslcommerz"
                  checked={paymentMethod === 'sslcommerz'}
                  onChange={() => setPaymentMethod('sslcommerz')}
                />
                <div className="payment-option-content">
                  <span className="payment-icon">💳</span>
                  <div>
                    <strong>SSLCommerz</strong>
                    <p>bKash, Nagad, Cards & more</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {error && <p className="checkout-error">{error}</p>}

          <button
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
          </button>
        </div>

        <div className="checkout-right">
          <h3>Order Summary</h3>
          <div className="order-items">
            {cartProductList.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px' }}>No items in cart</p>
            ) : (
              cartProductList.map(p => (
                <div key={p.product_id} className="order-item">
                  <img
                    src={p.image_url ? `http://localhost:5000${p.image_url}` : 'https://placehold.co/60x60'}
                    alt={p.product_name}
                  />
                  <div className="order-item-info">
                    <p className="order-item-name">{p.product_name}</p>
                    <p className="order-item-qty">Qty: {cartItems[p.product_id]}</p>
                    {cartSizes?.[p.product_id] && (
                      <p className="order-item-size">Size: {cartSizes[p.product_id]}</p>
                    )}
                  </div>
                  <p className="order-item-price">
                    ${(parseFloat(p.product_price) * cartItems[p.product_id]).toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="total-row discount">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;