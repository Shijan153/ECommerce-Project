import React, { useContext, useState } from 'react';
import './ProductDisplay.css';
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";
import { ShopContext } from '../../Context/ShopContext';

const ProductDisplay = (props) => {
    const { product } = props;
    const { addToCart } = useContext(ShopContext);
    const [selectedSize, setSelectedSize] = useState('');
    const [sizeError, setSizeError] = useState('');

    // ✅ FIXED: Use the Cloudinary URL directly from the database.
    // Prepending 'http://localhost:5000' was creating an invalid double-URL.
    const imageUrl = product.image_url || 'https://placehold.co/400x500?text=No+Image';

    // Excellent defensive check for PostgreSQL JSON/Array types
    const sizes = product.sizes
        ? (Array.isArray(product.sizes) ? product.sizes : JSON.parse(product.sizes))
        : [];

    const handleAddToCart = () => {
        if (sizes.length > 0 && !selectedSize) {
            setSizeError('Please select a size');
            return;
        }
        setSizeError('');
        // Ensure you're passing the product_id as defined in your Postgres schema
        addToCart(product.product_id, selectedSize);
    };

    const avgStars = Math.round(parseFloat(product.average_rating) || 0);

    return (
        <div className='productdisplay'>
            <div className="productdisplay-left">
                <div className="productdisplay-img-list">
                    <img src={imageUrl} alt={product.product_name} />
                    <img src={imageUrl} alt={product.product_name} />
                    <img src={imageUrl} alt={product.product_name} />
                    <img src={imageUrl} alt={product.product_name} />
                </div>
                <div className="productdisplay-img">
                    <img className='productdisplay-main-img' src={imageUrl} alt={product.product_name} />
                </div>
            </div>
            <div className="productdisplay-right">
                <h1>{product.product_name}</h1>
                <div className="productdisplay-right-star">
                    {[1, 2, 3, 4, 5].map(star => (
                        <img key={star}
                            src={star <= avgStars ? star_icon : star_dull_icon}
                            alt="rating star"
                        />
                    ))}
                    <p>({product.review_count || 0})</p>
                </div>
                <div className="productdisplay-right-prices">
                    {product.old_price && (
                        <div className="productdisplay-right-price-old">
                            ${parseFloat(product.old_price).toFixed(2)}
                        </div>
                    )}
                    <div className="productdisplay-right-price-new">
                        ${parseFloat(product.product_price).toFixed(2)}
                    </div>
                </div>
                <div className="productdisplay-right-description">
                    {product.product_description}
                </div>
                {sizes.length > 0 && (
                    <div className="productdisplay-right-size">
                        <h1>Select Size</h1>
                        <div className="productdisplay-right-sizes">
                            {sizes.map((size) => (
                                <div
                                    key={size}
                                    className={selectedSize === size ? 'size-selected' : ''}
                                    onClick={() => {
                                        setSelectedSize(size);
                                        setSizeError('');
                                    }}
                                >
                                    {size}
                                </div>
                            ))}
                        </div>
                        {sizeError && <p className="size-error" style={{color: 'red', marginTop: '10px'}}>{sizeError}</p>}
                        {selectedSize && (
                            <p className="size-chosen">Selected: <strong>{selectedSize}</strong></p>
                        )}
                    </div>
                )}
                <button onClick={handleAddToCart}>ADD TO CART</button>
                <p className='productdisplay-right-category'>
                    <span>Category :</span> {product.category_name}
                </p>
                <p className='productdisplay-right-category'>
                    <span>Tags :</span> Modern, Latest
                </p>
            </div>
        </div>
    );
};

export default ProductDisplay;