/*jshint esversion: 8 */
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3030;

// Models
const Reviews = require('./review');        // adjust path if needed
const Dealerships = require('./dealership'); // << use ONE dealerships model

// Middleware
app.use(cors());
app.use(require('body-parser').urlencoded({ extended: false }));
// Optional if you also POST JSON elsewhere:
// app.use(express.json());

const reviews_data = JSON.parse(fs.readFileSync('reviews.json', 'utf8'));
const dealerships_data = JSON.parse(fs.readFileSync('dealerships.json', 'utf8'));

// DB
mongoose.connect('mongodb://mongo_db:27017/', { dbName: 'dealershipsDB' });

// Seed safely (no res in top-level catch)
(async () => {
  try {
    await Reviews.deleteMany({});
    await Reviews.insertMany(reviews_data.reviews || []);

    await Dealerships.deleteMany({});
    await Dealerships.insertMany(dealerships_data.dealerships || []);
    console.log('Seeded reviews & dealerships');
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
})();

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Mongoose API');
});

// All reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Reviews by dealer (numeric id in your dataset)
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const dealerId = Number(req.params.id);
    const documents = await Reviews.find({ dealership: dealerId });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

/* ---------- Implemented endpoints ---------- */

// 1) Fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const dealers = await Dealerships.find({});
    res.status(200).json(dealers);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching dealers' });
  }
});

// 2) Fetch dealerships by state (case-insensitive)
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const state = req.params.state;
    const dealers = await Dealerships.find({ state: new RegExp(`^${state}$`, 'i') });
    res.status(200).json(dealers);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching dealers by state' });
  }
});

// 3) Fetch single dealer by dataset numeric id
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const dealer = await Dealerships.findOne({ id }); // dataset field "id"
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });
    res.status(200).json(dealer);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching dealer' });
  }
});

/* ------------------------------------------ */

// Insert review (kept as you had it)
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const data = JSON.parse(req.body);
    const last = await Reviews.find().sort({ id: -1 }).limit(1);
    const new_id = last.length ? last[0].id + 1 : 1;

    const review = new Reviews({
      id: new_id,
      name: data.name,
      dealership: data.dealership,
      review: data.review,
      purchase: data.purchase,
      purchase_date: data.purchase_date,
      car_make: data.car_make,
      car_model: data.car_model,
      car_year: data.car_year,
    });

    const savedReview = await review.save();
    res.json(savedReview);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error inserting review' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
