import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
import './CSS/SearchResults.css';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const { addToCart } = useContext(ShopContext);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter state
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    if (!query.trim()) return;
    fetchResults();
  }, [query, category, minPrice, maxPrice]);

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q: query });
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await fetch(`http://localhost:5000/api/products/search?${params}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data.data || []);
      } else {
        setError(data.message || 'Search failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSortedResults = () => {
    const sorted = [...results];
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.product_price - b.product_price);
    else if (sortBy === 'price-desc') sorted.sort((a, b) => b.product_price - a.product_price);
    else if (sortBy === 'rating') sorted.sort((a, b) => b.average_rating - a.average_rating);
    return sorted;
  };

  const clearFilters = () => {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
  };

  const sortedResults = getSortedResults();

  return (
    <div className="search-results-page">
      <div className="search-results-header">
        <h2>
          {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </h2>
      </div>

      <div className="search-results-layout">
        {/* ── Filters Sidebar ── */}
        <aside className="search-filters">
          <div className="filter-header">
            <h3>Filters</h3>
            <button className="clear-filters-btn" onClick={clearFilters}>Clear all</button>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="kids">Kids</option>
              <option value="sports">Sports</option>
              <option value="electronic devices">Electronic Devices</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min $"
                value={minPrice}
                min="0"
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>–</span>
              <input
                type="number"
                placeholder="Max $"
                value={maxPrice}
                min="0"
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </aside>

        {/* ── Results Grid ── */}
        <div className="search-results-content">
          {error && <p className="search-error">{error}</p>}

          {loading ? (
            <div className="search-loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="product-skeleton" />
              ))}
            </div>
          ) : sortedResults.length === 0 ? (
            <div className="search-empty">
              <p>😕 No products found for "<strong>{query}</strong>"</p>
              <p>Try a different keyword or clear the filters.</p>
              <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
            </div>
          ) : (
            <div className="search-products-grid">
              {sortedResults.map((product) => (
                <div key={product.product_id} className="search-product-card">
                  <Link to={`/product/${product.product_id}`}>
                    <div className="search-product-image">
                      <img
                        src={product.image_url || 'https://placehold.co/200x200?text=No+Image'}
                        alt={product.product_name}
                        onError={(e) => { e.target.src = 'https://placehold.co/200x200?text=No+Image'; }}
                      />
                      {product.old_price > product.product_price && (
                        <span className="search-badge">Sale</span>
                      )}
                    </div>
                    <div className="search-product-info">
                      <p className="search-product-category">{product.category_name}</p>
                      <p className="search-product-name">{product.product_name}</p>
                      <div className="search-product-rating">
                        {'★'.repeat(Math.round(product.average_rating || 0))}
                        {'☆'.repeat(5 - Math.round(product.average_rating || 0))}
                        <span>({product.review_count || 0})</span>
                      </div>
                      <div className="search-product-price">
                        <span className="new-price">${parseFloat(product.product_price).toFixed(2)}</span>
                        {product.old_price > product.product_price && (
                          <span className="old-price">${parseFloat(product.old_price).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product.product_id)}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
