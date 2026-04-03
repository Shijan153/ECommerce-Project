import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
import './CSS/Checkout.css';

const Checkout = () => {
  const { cartItems, allProducts, setCartItems, token } = useContext(ShopContext);
  const authToken = token || localStorage.getItem('auth-token');
  const navigate = useNavigate();

  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartEntries, setCartEntries] = useState([]);
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

  // Parse cartItems composite keys and build entries
  useEffect(() => {
    const parsed = Object.entries(cartItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([key, quantity]) => {
        const [product_id, selected_size] = key.split(':');
        return {
          product_id: Number(product_id),
          selected_size: selected_size || '',
          quantity
        };
      });
    setCartEntries(parsed);
  }, [cartItems]);

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

  const cartProductList = cartLoaded && cartEntries.length > 0
    ? cartEntries.map(entry => {
        const product = allProducts.find(p => p.product_id === entry.product_id);
        return { ...product, ...entry };
      }).filter(p => p.product_id)
    : [];

  const subtotal = cartProductList.reduce((sum, entry) => {
    return sum + (parseFloat(entry.product_price) * entry.quantity);
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
    return cartProductList.map(entry => ({
      product_id: entry.product_id,
      quantity: entry.quantity,
      price: parseFloat(entry.product_price),
      selected_size: entry.selected_size || null
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
              cartProductList.map(entry => (
                <div key={`${entry.product_id}:${entry.selected_size}`} className="order-item">
                  <img
                    src={entry.image_url || 'https://placehold.co/60x60?text=No+Image'}
                    alt={entry.product_name}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/60x60?text=No+Image';
                    }}
                  />
                  <div className="order-item-info">
                    <p className="order-item-name">{entry.product_name}</p>
                    <p className="order-item-qty">Qty: {entry.quantity}</p>
                    {entry.selected_size && (
                      <p className="order-item-size">Size: {entry.selected_size}</p>
                    )}
                  </div>
                  <p className="order-item-price">
                    ${(parseFloat(entry.product_price) * entry.quantity).toFixed(2)}
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
