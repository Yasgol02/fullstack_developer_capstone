import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import positive_icon from "../assets/positive.png";
import neutral_icon from "../assets/neutral.png";
import negative_icon from "../assets/negative.png";
import review_icon from "../assets/reviewbutton.png";
import Header from '../Header/Header';

const Dealer = () => {
  const [dealer, setDealer] = useState(null);        // null until loaded
  const [reviews, setReviews] = useState([]);        // always an array
  const [unreviewed, setUnreviewed] = useState(false);
  const [postReview, setPostReview] = useState(<></>);

  const params = useParams();
  const id = params.id;

  // Derive a stable root; if "dealer" isn't in URL, fall back to origin
  const currUrl = window.location.href;
  const cut = currUrl.indexOf("dealer");
  const rootUrl = cut >= 0 ? currUrl.substring(0, cut) : `${window.location.origin}/`;

  // Always include trailing slash to avoid 301s
  const dealerUrl  = `${rootUrl}djangoapp/dealer/${id}/`;
  const reviewsUrl = `${rootUrl}djangoapp/reviews/dealer/${id}/`;
  const postReviewUrl = `${rootUrl}postreview/${id}`;

  // tiny helpers to normalize unpredictable JSON shapes
  const firstOrNull = (x) => (Array.isArray(x) ? (x[0] ?? null) : (x ?? null));

  const get_dealer = async () => {
    try {
      const res = await fetch(dealerUrl, { method: "GET" });
      const data = await res.json();

      // Accept any of: {status, dealer: [...]}, {dealer: {...}}, {...}, [...]
      const d = data?.dealer ?? data;
      setDealer(firstOrNull(d));
    } catch (e) {
      console.error("get_dealer failed:", e);
      setDealer(null);
    }
  };

  const get_reviews = async () => {
    try {
      const res = await fetch(reviewsUrl, { method: "GET" });
      const data = await res.json();

      // Accept any of: {status, reviews: [...]}, [...]
      const arr = (Array.isArray(data?.reviews) ? data.reviews
                 : Array.isArray(data)          ? data
                 : []);
      setReviews(arr.filter(Boolean));
      setUnreviewed(arr.length === 0);
    } catch (e) {
      console.error("get_reviews failed:", e);
      setReviews([]);
      setUnreviewed(true);
    }
  };

  const senti_icon = (sentiment) =>
    sentiment === "positive" ? positive_icon :
    sentiment === "negative" ? negative_icon : neutral_icon;

  useEffect(() => {
    get_dealer();
    get_reviews();
    if (sessionStorage.getItem("username")) {
      setPostReview(
        <a href={postReviewUrl}>
          <img src={review_icon} style={{ width: '10%', marginLeft: '10px', marginTop: '10px' }} alt='Post Review' />
        </a>
      );
    } else {
      setPostReview(<></>);
    }
    // re-run if id changes
  }, [id]); 

  // Loading / not found guards prevent "e is undefined" on first render
  if (dealer === null) {
    return (
      <div style={{ margin: "20px" }}>
        <Header />
        <div style={{ marginTop: "10px" }}>
          <h1 style={{ color: "grey" }}>Loading dealer…</h1>
        </div>
      </div>
    );
  }

  const dealerName = dealer?.full_name ?? dealer?.name ?? "Dealer";
  const addressLine = [
    dealer?.city,
    dealer?.address,
    dealer?.zip ? `Zip - ${dealer.zip}` : null,
    dealer?.state
  ].filter(Boolean).join(", ");

  return (
    <div style={{ margin: "20px" }}>
      <Header />
      <div style={{ marginTop: "10px" }}>
        <h1 style={{ color: "grey" }}>
          {dealerName}{postReview}
        </h1>
        {addressLine && (
          <h4 style={{ color: "grey" }}>{addressLine}</h4>
        )}
      </div>

      <div className="reviews_panel">
        {reviews.length === 0 && !unreviewed ? (
          <span>Loading Reviews…</span>
        ) : unreviewed ? (
          <div>No reviews yet!</div>
        ) : (
          reviews.map((review, i) => (
            <div className='review_panel' key={review?.id ?? i}>
              <img src={senti_icon(review?.sentiment)} className="emotion_icon" alt='Sentiment' />
              <div className='review'>{review?.review ?? ""}</div>
              <div className="reviewer">
                {review?.name ?? "Anonymous"} {review?.car_make ?? ""} {review?.car_model ?? ""} {review?.car_year ?? ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dealer;
