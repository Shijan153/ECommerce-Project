import React, { useContext } from 'react'
import './ProductDisplay.css'
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";
import { ShopContext } from '../../Context/ShopContext';

const ProductDisplay = (props) => {
    const { product } = props;
    const { addToCart } = useContext(ShopContext);

    const imageUrl = product.image_url
        ? `http://localhost:5000${product.image_url}`
        : 'https://placehold.co/200x200';

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
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_dull_icon} alt="" />
                    <p>({product.review_count || 0})</p>
                </div>
                <div className="productdisplay-right-prices">
                    <div className="productdisplay-right-price-old">${product.old_price}</div>
                    <div className="productdisplay-right-price-new">${product.product_price}</div>
                </div>
                <div className="productdisplay-right-description">
                    {product.product_description}
                </div>
                <div className="productdisplay-right-size">
                    <h1>Select Size</h1>
                    <div className="productdisplay-right-sizes">
                        {product.sizes
                            ? JSON.parse(product.sizes).map((size) => (
                                <div key={size}>{size}</div>
                            ))
                            : ['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                                <div key={size}>{size}</div>
                            ))
                        }
                    </div>
                </div>
                <button onClick={() => addToCart(product.product_id)}>ADD TO CART</button>
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