import React from 'react'
import './Item.css'
import { Link } from 'react-router-dom'

const Item = (props) => {
  // Make sure the image URL is correctly formatted
  const imageUrl = props.image 
    ? `http://localhost:5000${props.image}`
    : 'https://via.placeholder.com/200';

  console.log('Loading image from:', imageUrl); // Add this to debug

  return (
    <div className='item'>
      <Link to={`/product/${props.id}`} onClick={() => window.scrollTo(0, 0)}>
        <img
          src={imageUrl}
          alt={props.name}
          onError={(e) => {
            console.log('Image failed to load:', imageUrl);
            e.target.src = 'https://via.placeholder.com/200';
          }}
        />
      </Link>
      <p>{props.name}</p>
      <div className="item-prices">
        <div className="item-price-new">
            ${props.new_price}
        </div>
        {props.old_price && (
          <div className="item-price-old">
            ${parseFloat(props.old_price).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}

export default Item