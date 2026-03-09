import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ShopContext } from '../../Context/ShopContext';
import './ProductReviews.css';
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";

const ProductReviews = ({ productId }) => {
  const { token } = useContext(ShopContext);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/reviews/${productId}`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setReviewCount(data.reviewCount);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [productId]);

  const checkUserReview = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:4000/api/reviews/${productId}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.review) {
        setUserReview(data.review);
        setRating(data.review.rating);
        setReviewText(data.review.review_text);
      }
    } catch (error) {
      console.error('Error checking user review:', error);
    }
  }, [productId, token]);

  useEffect(() => {
    fetchReviews();
    checkUserReview();
  }, [fetchReviews, checkUserReview]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please login to submit a review');
      return;
    }
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          rating,
          review_text: reviewText
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Review submitted successfully!');
        setUserReview({ rating, review_text: reviewText });
        fetchReviews();
      } else {
        alert(data.message || 'Error submitting review');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!userReview) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/reviews/${userReview.review_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          review_text: reviewText
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Review updated successfully!');
        setUserReview({ ...userReview, rating, review_text: reviewText });
        fetchReviews();
      } else {
        alert(data.message || 'Error updating review');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update review');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/reviews/${userReview.review_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Review deleted successfully!');
        setUserReview(null);
        setRating(0);
        setReviewText('');
        fetchReviews();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete review');
    }
  };

  const renderStars = (currentRating, interactive = false) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (interactive) {
        stars.push(
          <img
            key={i}
            src={i <= (hoverRating || rating) ? star_icon : star_dull_icon}
            alt=""
            onClick={() => setRating(i)}
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            style={{ cursor: 'pointer' }}
          />
        );
      } else {
        stars.push(
          <img
            key={i}
            src={i <= currentRating ? star_icon : star_dull_icon}
            alt=""
          />
        );
      }
    }
    return stars;
  };

  return (
    <div className="product-reviews">
      <div className="reviews-summary">
        <h3>Customer Reviews</h3>
        <div className="average-rating">
          <div className="rating-stars">
            {renderStars(averageRating)}
          </div>
          <span className="rating-value">{averageRating.toFixed(1)} out of 5</span>
          <span className="review-count">({reviewCount} reviews)</span>
        </div>
      </div>

      {token && (
        <div className="write-review">
          <h4>{userReview ? 'Your Review' : 'Write a Review'}</h4>
          <form onSubmit={userReview ? handleUpdateReview : handleSubmitReview}>
            <div className="rating-input">
              <label>Your Rating:</label>
              <div className="star-rating">
                {renderStars(rating, true)}
              </div>
            </div>
            
            <div className="review-input">
              <textarea
                placeholder="Share your thoughts about this product..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows="4"
                required
              />
            </div>

            <div className="review-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : (userReview ? 'Update Review' : 'Submit Review')}
              </button>
              {userReview && (
                <button type="button" onClick={handleDeleteReview} className="delete-btn">
                  Delete Review
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="reviews-list">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.review_id} className="review-item">
              <div className="review-header">
                <span className="reviewer-name">{review.user_name || 'Anonymous'}</span>
                <span className="review-date">
                  {new Date(review.review_date).toLocaleDateString()}
                </span>
              </div>
              <div className="review-rating">
                {renderStars(review.rating)}
              </div>
              <p className="review-text">{review.review_text}</p>
            </div>
          ))
        ) : (
          <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;