import React, { useEffect, useState } from "react";
import "./NewCollections.css";
import Item from '../Item/Item';

const NewCollections = () => {
  const [newCollections, setNewCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/products/new-collections')
      .then(res => res.json())
      .then(data => setNewCollections(data.data || []))
      .catch(err => console.error('Error fetching new collections:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="new-collections">
      <h1>NEW COLLECTIONS</h1>
      <hr />
      {loading ? (
        <div className="collections-loading">Loading...</div>
      ) : (
        <div className="collections">
          {newCollections.map(item => (
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

export default NewCollections;