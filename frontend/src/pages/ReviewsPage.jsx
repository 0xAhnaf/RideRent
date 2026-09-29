import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api";
import "./ReviewsPage.css";

export default function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [eligibility, setEligibility] = useState(null);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadReviews = async () => {
    const response = await apiFetch("/api/reviews");
    if (!response.ok) throw new Error("Could not load reviews.");
    const data = await response.json();
    setReviews(data);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await apiFetch("/api/reviews");
        if (!response.ok) throw new Error("Could not load reviews.");
        const data = await response.json();
        if (active) setReviews(data);
      } catch (error) {
        if (active) setReviewsError(error.message);
      } finally {
        if (active) setReviewsLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setEligibility({ can_review: false, reason: "login" });
      return;
    }

    let active = true;
    const loadEligibility = async () => {
      try {
        const response = await apiFetch("/api/reviews/eligibility");
        if (!response.ok) throw new Error("Could not check review eligibility.");
        const data = await response.json();
        if (active) setEligibility(data);
      } catch {
        if (active) setEligibility({ can_review: false, reason: "error" });
      }
    };

    loadEligibility();
    return () => { active = false; };
  }, [user, authLoading]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (submitting || !eligibility?.can_review) return;

    if (!comment.trim()) {
      setMessage("Please write a review.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ rating: Number(rating), comment: comment.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not submit review.");

      setComment("");
      setEligibility({ can_review: false, reason: "already_reviewed" });
      setMessage("Review submitted successfully.");

      try {
        await loadReviews();
        setReviewsError("");
      } catch (error) {
        setReviewsError(error.message);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="reviews-page">
      <header className="reviews-header">
        <span className="reviews-eyebrow">RIDERENT COMMUNITY</span>
        <h1>Customer Reviews</h1>
        <p>Read what renters think about their trips and service.</p>
      </header>

      <section className="reviews-write-section" aria-labelledby="write-review">
        <h2 id="write-review">Share your experience</h2>

        {authLoading || eligibility === null ? (
          <p>Checking review access...</p>
        ) : eligibility.can_review ? (
          <form className="review-form" onSubmit={submitReview}>
            <label htmlFor="review-rating">Your rating</label>
            <div className="review-rating-select-wrap">
              <select
                id="review-rating"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                disabled={submitting}
              >
                <option value="5">★★★★★  ·  Excellent</option>
                <option value="4">★★★★☆  ·  Good</option>
                <option value="3">★★★☆☆  ·  Average</option>
                <option value="2">★★☆☆☆  ·  Poor</option>
                <option value="1">★☆☆☆☆  ·  Very poor</option>
              </select>
            </div>

            <label htmlFor="review-comment">Your review</label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Tell others about your experience..."
              disabled={submitting}
              required
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        ) : eligibility.reason === "login" ? (
          <p><Link to="/login">Log in</Link> to review after completing a booking.</p>
        ) : eligibility.reason === "admin" ? (
          <p>Admins can read reviews but cannot submit one.</p>
        ) : eligibility.reason === "already_reviewed" ? (
          <p>You have already shared your review. Thank you!</p>
        ) : eligibility.reason === "no_completed_booking" ? (
          <p>Complete a car or ambulance booking to write a review.</p>
        ) : (
          <p>Review access could not be checked. Refresh the page.</p>
        )}

        {message && <p className="review-message" role="status">{message}</p>}
      </section>

      <section className="reviews-list-section" aria-labelledby="all-reviews">
        <h2 id="all-reviews">All Reviews</h2>

        {reviewsLoading ? (
          <p>Loading reviews...</p>
        ) : reviewsError ? (
          <p role="alert">{reviewsError}</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <div className="reviews-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card-top">
                  <strong>{review.reviewer_name}</strong>
                  <span aria-label={`${review.rating} out of 5 stars`}>
                    {"★".repeat(Number(review.rating))}
                    {"☆".repeat(5 - Number(review.rating))}
                  </span>
                </div>
                <p>{review.comment}</p>
                <time dateTime={review.created_at}>
                  {review.created_at?.slice(0, 10)}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
