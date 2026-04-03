import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
import './CSS/Checkout.css';

const Checkout = () => {
  const { cartItems, cartSizes, allProducts, setCartItems, token } = useContext(ShopContext);
  const authToken = token || localStorage.getItem('auth-token');
  const navigate = useNavigate();

  const [cartLoaded, setCartLoaded] = useState(false);
  const [form, setForm] = useState({
    promo_code: '',
    order_notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Wait until allProducts is populated before filtering
  useEffect(() => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    if (allProducts.length > 0) {
      setCartLoaded(true);
    }
  }, [allProducts, authToken, navigate]);

  const cartProductList = cartLoaded
    ? allProducts.filter(p => cartItems[p.product_id] > 0)
    : [];

  const subtotal = cartProductList.reduce((sum, p) => {
    return sum + (parseFloat(p.product_price) * cartItems[p.product_id]);
  }, 0);

  const total = Math.max(subtotal - discount, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const applyPromo = async () => {
    setError('');
    setPromoApplied(false);
    setDiscount(0);

    const code = form.promo_code?.trim();
    if (!code) {
      setError('Please enter a promo code.');
      return;
    }

    setPromoApplying(true);
    try {
      const res = await fetch('http://localhost:5000/api/promo/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, cart_total: subtotal.toFixed(2) })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid promo code');
        return;
      }

      const appliedDiscount = parseFloat(data.data?.applied_discount || data.applied_discount || 0);
      if (appliedDiscount <= 0) {
        setError('Promo code is valid but no discount applies.');
        return;
      }

      setDiscount(appliedDiscount);
      setPromoApplied(true);
      setError('');
    } catch (err) {
      console.error('Promo apply error:', err);
      setError('Unable to apply promo code at the moment.');
    } finally {
      setPromoApplying(false);
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
    if (!authToken) {
      navigate('/login');
      return;
    }
    if (cartProductList.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = 'http://localhost:5000/api/orders/cod';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          order_notes: form.order_notes,
          total_amount: total.toFixed(2),
          promo_code: form.promo_code || null,
          discount_amount: discount > 0 ? discount.toFixed(2) : 0,
          items: buildOrderItems()
        })
      });

      const data = await response.json();
      console.log('Order response:', data);

      if (response.ok) {
        if (setCartItems) setCartItems({});
        navigate(`/order-confirmation?tran_id=${data.data.tran_id}&status=success`);
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
            <h3>Order Notes</h3>
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
              <button
                type="button"
                className="promo-btn"
                onClick={applyPromo}
                disabled={promoApplying}
              >
                {promoApplying ? 'Applying...' : 'Apply'}
              </button>
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
            </div>
          </div>

          {error && <p className="checkout-error">{error}</p>}

          <button
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={loading || !cartLoaded}
          >
            {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
          </button>
        </div>

        <div className="checkout-right">
          <h3>Order Summary</h3>
          <div className="order-items">
            {!cartLoaded ? (
              <p style={{ color: '#888', fontSize: '14px' }}>Loading cart...</p>
            ) : cartProductList.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px' }}>No items in cart</p>
            ) : (
              cartProductList.map(p => (
                <div key={p.product_id} className="order-item">
                  <img
                    src={p.image_url || 'https://placehold.co/60x60?text=No+Image'}
                    alt={p.product_name}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/60x60?text=No+Image';
                    }}
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
