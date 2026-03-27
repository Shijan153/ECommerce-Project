import React from 'react'
import './Item.css'
import { Link } from 'react-router-dom'

const Item = (props) => {
  const imageUrl = props.image || 'https://placehold.co/200x200';

  return (
    <div className='item'>
      <Link to={`/product/${props.id}`} onClick={() => window.scrollTo(0, 0)}>
        <img
          src={imageUrl}
          alt={props.name}
          onError={e => { e.target.src = 'https://placehold.co/200x200'; }}
        />
      </Link>
      <p>{props.name}</p>
      <div className="item-prices">
        <div className="item-price-new">
          ${parseFloat(props.new_price).toFixed(2)}
        </div>
        {props.old_price && parseFloat(props.old_price) !== parseFloat(props.new_price) && (
          <div className="item-price-old">
            ${parseFloat(props.old_price).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}

export default Item