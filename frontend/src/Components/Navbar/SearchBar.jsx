import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/products/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setSuggestions((data.data || []).slice(0, 5)); // show max 5 suggestions
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (product) => {
    setShowDropdown(false);
    setQuery('');
    navigate(`/product/${product.product_id}`);
  };

  return (
    <div className="searchbar-wrapper" ref={wrapperRef}>
      <form className="searchbar-form" onSubmit={handleSearch}>
        <input
          type="text"
          className="searchbar-input"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        />
        <button type="submit" className="searchbar-btn">
          🔍
        </button>
      </form>

      {showDropdown && (
        <div className="searchbar-dropdown">
          {loading ? (
            <div className="searchbar-loading">Searching...</div>
          ) : suggestions.length === 0 ? (
            <div className="searchbar-no-result">No products found</div>
          ) : (
            suggestions.map((product) => (
              <div
                key={product.product_id}
                className="searchbar-suggestion"
                onClick={() => handleSuggestionClick(product)}
              >
                <img
                  src={product.image_url || 'https://placehold.co/40x40?text=?'}
                  alt={product.product_name}
                  onError={(e) => { e.target.src = 'https://placehold.co/40x40?text=?'; }}
                />
                <div className="suggestion-info">
                  <span className="suggestion-name">{product.product_name}</span>
                  <span className="suggestion-category">{product.category_name}</span>
                </div>
                <span className="suggestion-price">
                  ${parseFloat(product.product_price).toFixed(2)}
                </span>
              </div>
            ))
          )}
          {!loading && suggestions.length > 0 && (
            <div
              className="searchbar-see-all"
              onClick={() => {
                setShowDropdown(false);
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
            >
              See all results for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
