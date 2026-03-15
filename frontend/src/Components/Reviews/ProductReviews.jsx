import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../../Context/ShopContext';
import './ProductReviews.css';

const StarDisplay = ({ rating }) => {
  return (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= rating ? 'star filled' : 'star empty'}>★</span>
      ))}
    </div>
  );
};

const StarSelector = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-selector">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={star <= (hovered || value) ? 'star filled' : 'star empty'}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >★</span>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId }) => {
  const { token } = useContext(ShopContext);
  const authToken = token || localStorage.getItem('auth-token');

  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [canReviewReason, setCanReviewReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [star, setStar] = useState(0);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchReviews();
    if (authToken) checkCanReview();
  }, [productId, authToken]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/product/${productId}`);
      const data = await res.json();
      setReviews(data.data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/can-review/${productId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      setCanReview(data.data?.canReview || false);
      setCanReviewReason(data.data?.reason || '');
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const handleSubmit = async () => {
    if (!star) { setError('Please select a star rating'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ product_id: productId, star, description })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Review submitted successfully!');
        setShowForm(false);
        setStar(0);
        setDescription('');
        setCanReview(false);
        fetchReviews();
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.star, 0) / reviews.length).toFixed(1)
    : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="product-reviews">
      <div className="reviews-header">
        <h2>Customer Reviews</h2>
        {reviews.length > 0 && (
          <div className="avg-rating">
            <span className="avg-number">{avgRating}</span>
            <StarDisplay rating={Math.round(avgRating)} />
            <span className="review-count">({reviews.length} reviews)</span>
          </div>
        )}
      </div>

      {authToken ? (
        canReview ? (
          <div className="write-review-section">
            {!showForm ? (
              <button className="write-review-btn" onClick={() => setShowForm(true)}>
                Write a Review
              </button>
            ) : (
              <div className="review-form">
                <h3>Write Your Review</h3>
                <div className="form-group">
                  <label>Rating *</label>
                  <StarSelector value={star} onChange={setStar} />
                </div>
                <div className="form-group">
                  <label>Review (Optional)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                  />
                </div>
                {error && <p className="review-error">{error}</p>}
                <div className="form-actions">
                  <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button className="cancel-btn" onClick={() => { setShowForm(false); setError(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          canReviewReason && (
            <p className="cant-review-msg">{canReviewReason}</p>
          )
        )
      ) : (
        <p className="login-to-review">Please login to write a review</p>
      )}

      {success && <p className="review-success">{success}</p>}

      <div className="reviews-list">
        {loading ? (
          <p className="reviews-loading">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map(review => (
            <div key={review.rating_id} className="review-card">
              <div className="review-top">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.customer_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="reviewer-name">{review.customer_name}</p>
                    <p className="review-date">{formatDate(review.review_date)}</p>
                  </div>
                </div>
                <StarDisplay rating={review.star} />
              </div>
              {review.description && (
                <p className="review-text">{review.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;