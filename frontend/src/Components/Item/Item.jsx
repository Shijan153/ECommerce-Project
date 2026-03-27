import React from 'react';
import './Item.css'; 
import { Link } from 'react-router-dom';

const Item = (props) => {
  return (
    <div className='item'>
      <Link to={`/product/${props.id}`} onClick={() => window.scrollTo(0, 0)}>
        <img src={props.image} alt={props.name} />
      </Link>
      <p>{props.name}</p>
      <div className="item-prices">
        <div className="item-price-new">${parseFloat(props.new_price).toFixed(2)}</div>
        {props.old_price > 0 && <div className="item-price-old">${parseFloat(props.old_price).toFixed(2)}</div>}
      </div>
    </div>
  );
};
export default Item;