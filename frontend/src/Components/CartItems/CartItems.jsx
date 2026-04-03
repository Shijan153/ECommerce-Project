import React, { useContext, useState, useEffect } from 'react'
import './CartItems.css'
import { ShopContext } from '../../Context/ShopContext'
import remove_icon from '../Assets/cart_cross_icon.png'
import { useNavigate } from 'react-router-dom'

const CartItems = () => {
    const { cartItems, removeFromCart, increment, decrement } = useContext(ShopContext);
    const [cartProducts, setCartProducts] = useState([]);
    const [cartEntries, setCartEntries] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const cartEntryList = Object.entries(cartItems)
            .filter(([, quantity]) => quantity > 0)
            .map(([key, quantity]) => {
                const [product_id, selected_size] = key.split(':');
                return {
                    product_id: Number(product_id),
                    selected_size: selected_size || '',
                    quantity
                };
            });

        setCartEntries(cartEntryList);

        const productIds = [...new Set(cartEntryList.map(entry => entry.product_id))];
        if (productIds.length === 0) { setCartProducts([]); return; }

        const fetchCartProducts = async () => {
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

    const subtotal = cartEntries.reduce((sum, entry) => {
        const product = cartProducts.find(p => p.product_id === entry.product_id);
        if (!product) return sum;
        return sum + (parseFloat(product.product_price) * entry.quantity);
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
            {cartEntries.map((entry) => {
                const product = cartProducts.find(p => p.product_id === entry.product_id);
                if (!product || entry.quantity <= 0) return null;
                const itemKey = `${entry.product_id}:${entry.selected_size}`;
                return (
                    <div key={itemKey}>
                        <div className="cartitems-format cartitems-format-main">
                            <img
                                src={product.image_url || 'https://placehold.co/200x200?text=No+Image'}
                                alt={product.product_name}
                                className='carticon-product-icon'
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/200x200?text=No+Image';
                                }}
                            />
                            <div>
                                <p>{product.product_name}</p>
                                {entry.selected_size && (
                                    <p className="cart-item-size">Size: <strong>{entry.selected_size}</strong></p>
                                )}
                            </div>
                            <p>${parseFloat(product.product_price).toFixed(2)}</p>
                            <button className='cartitems-quantity'>{entry.quantity}</button>
                            <p>${(parseFloat(product.product_price) * entry.quantity).toFixed(2)}</p>
                            <img
                                className='cartitems-remove-icon'
                                src={remove_icon}
                                onClick={() => removeFromCart(entry.product_id, entry.selected_size)}
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
            </div>
        </div>
    );
};

export default CartItems;