import React, { useEffect, useState } from 'react';
import './Popular.css';
import Item from '../Item/Item';

const Popular = () => {
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/products/popular')
      .then(res => res.json())
      .then(data => setPopular(data.data || []))
      .catch(err => console.error('Error fetching popular products:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='popular'>
      <h1>MOST POPULAR</h1>
      <hr />
      {loading ? (
        <div className="popular-loading">Loading...</div>
      ) : (
        <div className="popular-item">
          {popular.map(item => (
            <Item
              key={item.product_id}
              id={item.product_id}
              name={item.product_name}
              image={`http://localhost:5000${item.image_url}`}
              new_price={item.product_price}
              old_price={item.old_price}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Popular;