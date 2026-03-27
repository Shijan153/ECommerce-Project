import React, { useContext, useState, useEffect } from 'react'
import './CartItems.css'
import { ShopContext } from '../../Context/ShopContext'
import remove_icon from '../Assets/cart_cross_icon.png'
import { useNavigate } from 'react-router-dom'

const CartItems = () => {
    const { cartItems, cartSizes, removeFromCart } = useContext(ShopContext);
    const [cartProducts, setCartProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCartProducts = async () => {
            const productIds = Object.keys(cartItems).filter(id => cartItems[id] > 0);
            if (productIds.length === 0) { setCartProducts([]); return; }
            try {
                const promises = productIds.map(id =>
                    fetch(`http://localhost:5000/api/products/${id}`).then(r => r.json())
                );
                const results = await Promise.all(promises);
                setCartProducts(results.filter(r => r.data).map(r => r.data));
            } catch (error) {
                console.error('Error fetching cart products:', error);
            }
        };
        fetchCartProducts();
    }, [cartItems]);

    const subtotal = cartProducts.reduce((sum, product) => {
        return sum + (parseFloat(product.product_price) * (cartItems[product.product_id] || 0));
    }, 0);

    return (
        <div className='cartitems'>
            <div className="cartitems-format-main">
                <p>Products</p>
                <p>Title</p>
                <p>Price</p>
                <p>Quantity</p>
                <p>Total</p>
                <p>Remove</p>
            </div>
            <hr />
            {cartProducts.map((product) => {
                const quantity = cartItems[product.product_id];
                if (!quantity || quantity <= 0) return null;
                const imageUrl = product.image_url
                    ? `http://localhost:5000${product.image_url}`
                    : 'https://placehold.co/200x200';
                const selectedSize = cartSizes?.[product.product_id];
                return (
                    <div key={product.product_id}>
                        <div className="cartitems-format cartitems-format-main">
                            <img src={imageUrl} alt={product.product_name} className='carticon-product-icon' />
                            <div>
                                <p>{product.product_name}</p>
                                {selectedSize && (
                                    <p className="cart-item-size">Size: <strong>{selectedSize}</strong></p>
                                )}
                            </div>
                            <p>${parseFloat(product.product_price).toFixed(2)}</p>
                            <button className='cartitems-quantity'>{quantity}</button>
                            <p>${(parseFloat(product.product_price) * quantity).toFixed(2)}</p>
                            <img
                                className='cartitems-remove-icon'
                                src={remove_icon}
                                onClick={() => removeFromCart(product.product_id)}
                                alt="remove"
                            />
                        </div>
                        <hr />
                    </div>
                );
            })}
            {cartProducts.length === 0 && (
                <p style={{ textAlign: 'center', padding: '20px' }}>Your cart is empty</p>
            )}
            <div className="cartitems-down">
                <div className="cartitems-total">
                    <h1>Cart Totals</h1>
                    <div>
                        <div className="cartitems-total-item">
                            <p>Subtotal</p>
                            <p>${subtotal.toFixed(2)}</p>
                        </div>
                        <hr />
                        <div className="cartitems-total-item">
                            <p>Shipping Fee</p>
                            <p>Free</p>
                        </div>
                        <hr />
                        <div className="cartitems-total-item">
                            <h3>Total</h3>
                            <h3>${subtotal.toFixed(2)}</h3>
                        </div>
                    </div>
                    <button onClick={() => navigate('/checkout')}>PROCEED TO CHECKOUT</button>
                </div>
                <div className="cartitems-promocode">
                    <p>If you have a promo code, enter it here</p>
                    <div className="cartitems-promobox">
                        <input type="text" placeholder='promo code' />
                        <button>Submit</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartItems;