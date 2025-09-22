import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';

const PostReview = () => {
  const [dealer, setDealer] = useState(null);
  const [review, setReview] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carmodels, setCarmodels] = useState([]);

  const { id } = useParams();

  // derive root safely (fallback to origin if "postreview" not in URL)
  const curr_url = window.location.href;
  const cut = curr_url.indexOf("postreview");
  const root_url = cut >= 0 ? curr_url.substring(0, cut) : `${window.location.origin}/`;

  // ✅ match Django patterns (trailing slashes on the detail/reviews; get_cars has no slash)
  const dealer_url     = `${root_url}djangoapp/dealer/${id}/`;
  const review_url     = `${root_url}djangoapp/add_review/`;   // <-- IMPORTANT: slash
  const carmodels_url  = `${root_url}djangoapp/get_cars`;

  // Optional: CSRF helper (only needed if using Django session auth + CSRF)
  const getCookie = (name) => {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : "";
  };

  const postreview = async () => {
    let name = `${sessionStorage.getItem("firstname") ?? ""} ${sessionStorage.getItem("lastname") ?? ""}`.trim();
    if (!name || name.toLowerCase().includes("null")) {
      name = sessionStorage.getItem("username") || "Anonymous";
    }

    if (!model || !review.trim() || !date || !year) {
      alert("All details are mandatory");
      return;
    }

    // Split "Make Model ..." -> first token = make, rest = model (preserve spaces/hyphens)
    const parts = model.split(" ");
    const make_chosen = parts.shift();
    const model_chosen = parts.join(" ") || "";

    const payload = {
      name,
      dealership: Number(id),
      review: review.trim(),
      purchase: true,
      purchase_date: date,           // YYYY-MM-DD
      car_make: make_chosen,
      car_model: model_chosen,
      car_year: Number(year),
    };

    try {
      const res = await fetch(review_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "X-CSRFToken": getCookie("csrftoken"), // uncomment if CSRF is enforced
        },
        credentials: "include", // include cookies if you rely on session auth
        body: JSON.stringify(payload),
      });

      // Read as text first so we can handle HTML error pages gracefully
      const text = await res.text();

      if (!res.ok) {
        console.error("POST /add_review/ failed", res.status, text);
        alert(`Add review failed (${res.status}). Check server logs.`);
        return;
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        console.error("Expected JSON, got:", text);
        alert("Server returned a non-JSON response.");
        return;
      }

      if (json?.status === 200) {
        window.location.href = `${window.location.origin}/dealer/${id}`;
      } else {
        alert("Review not accepted by server.");
      }
    } catch (err) {
      console.error("Network error posting review", err);
      alert("Network error submitting review.");
    }
  };

  const get_dealer = async () => {
    try {
      const res = await fetch(dealer_url, { method: "GET" });
      const data = await res.json();
      const d = data?.dealer ?? data;
      const first = Array.isArray(d) ? d[0] : d;
      setDealer(first ?? null);
    } catch (e) {
      console.error("get_dealer failed:", e);
      setDealer(null);
    }
  };

  const get_cars = async () => {
    try {
      const res = await fetch(carmodels_url, { method: "GET" });
      const data = await res.json();
      const list = Array.isArray(data?.CarModels) ? data.CarModels : [];
      setCarmodels(list);
    } catch (e) {
      console.error("get_cars failed:", e);
      setCarmodels([]);
    }
  };

  useEffect(() => {
    get_dealer();
    get_cars();
  }, [id]);

  const dealerName = dealer?.full_name ?? dealer?.name ?? "Dealer";

  return (
    <div>
      <Header />
      <div style={{ margin: "5%" }}>
        <h1 style={{ color: "darkblue" }}>{dealer ? dealerName : "Loading dealer…"}</h1>

        <textarea
          id="review"
          cols="50"
          rows="7"
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />

        <div className='input_field'>
          Purchase Date{" "}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className='input_field'>
          Car Make{" "}
          <select
            name="cars"
            id="cars"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="" disabled>Choose Car Make and Model</option>
            {carmodels.map((c, i) => (
              <option key={`${c.CarMake}-${c.CarModel}-${i}`} value={`${c.CarMake} ${c.CarModel}`}>
                {c.CarMake} {c.CarModel}
              </option>
            ))}
          </select>
        </div>

        <div className='input_field'>
          Car Year{" "}
          <input
            type="number"       // ✅ number, not "int"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            max={new Date().getFullYear()}
            min={2010}
          />
        </div>

        <div>
          <button className='postreview' onClick={postreview}>Post Review</button>
        </div>
      </div>
    </div>
  );
};

export default PostReview;
