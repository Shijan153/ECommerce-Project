import React, { useEffect, useState } from 'react';
import './Popular.css';
import Item from '../Item/Item';

const Popular = () => {
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetching the popular products from your Node.js API
    fetch('http://localhost:5000/api/products/popular')
      .then(res => res.json())
      .then(data => {
        // Your responseHandler returns { status, message, data: [...] }
        setPopular(data.data || []);
      })
      .catch(err => console.error('Error fetching popular products:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='popular'>
      <h1>MOST POPULAR</h1>
      <hr />
      {loading ? (
        <div className="popular-loading">Loading Popular Products...</div>
      ) : (
        <div className="popular-item">
          {popular.length > 0 ? (
            popular.map((item) => (
              <Item
                key={item.product_id}
                id={item.product_id}
                name={item.product_name}
                /* ✅ FIXED: Use item.image_url directly. 
                   Since your DB stores 'https://res.cloudinary.com/...', 
                   prepending 'http://localhost:5000' was breaking the link. 
                */
                image={item.image_url} 
                new_price={item.product_price}
                old_price={item.old_price}
              />
            ))
          ) : (
            <p>No popular products found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Popular;