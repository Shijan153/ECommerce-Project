import React, { useEffect, useState } from "react";
import "./RelatedProducts.css";
import Item from "../Item/Item";

const RelatedProducts = ({ productId, category }) => {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        let endpoint = "http://localhost:5000/api/products";
        if (category) {
          endpoint = `http://localhost:5000/api/products?category=${encodeURIComponent(category)}`;
        }

        const response = await fetch(endpoint);
        const data = await response.json();
        const items = (data.data || []).filter(item => item.product_id !== productId);
        setRelated(items.slice(0, 8));
      } catch (err) {
        console.error("Error fetching related products:", err);
        setRelated([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [productId, category]);

  if (loading) {
    return (
      <div className="relatedproducts">
        <h1>Related Products</h1>
        <hr />
        <p>Loading related products...</p>
      </div>
    );
  }

  return (
    <div className="relatedproducts">
      <h1>Related Products</h1>
      <hr />
      <div className="relatedproducts-item">
        {related.length > 0 ? (
          related.map(item => (
            <Item
              key={item.product_id}
              id={item.product_id}
              name={item.product_name}
              image={item.image_url}
              new_price={item.product_price}
              old_price={item.old_price}
            />
          ))
        ) : (
          <p>No related products found in DB.</p>
        )}
      </div>
    </div>
  );
};

export default RelatedProducts;
