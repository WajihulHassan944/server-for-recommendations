const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Schema and model
const recommendationSchema = new mongoose.Schema({
  name: String,
  email: String,
  text: String,
  approvalStatus: {
    type: String,
    default: 'unapproved',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'vascularbundle43@gmail.com',
    pass: 'fhvlqvbjdbpgovub',
  },
});

// GET: Fetch all recommendations
app.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await Recommendation.find();
    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendations', error });
  }
});


// POST: Submit recommendation and send email
app.post('/recommendation', async (req, res) => {
  try {
    const { name, email, text } = req.body;
    const newRecommendation = new Recommendation({ name, email, text });
    await newRecommendation.save();

    const mailOptions = {
      from: 'vascularbundle43@gmail.com',
      to: 'wajih786hassan@gmail.com',
      subject: 'New Recommendation Submitted',
      html: `
        <p>A new recommendation has been submitted by ${name}.</p>
        <p>Recommendation: ${text}</p>
        <button><a href="http://localhost:${PORT}/approve/${newRecommendation._id}">Approve</a></button>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending email', error });
      }
      res.status(201).json({ message: 'Recommendation submitted and email sent', recommendation: newRecommendation });
    });
  } catch (error) {
    res.status(400).json({ message: 'Error submitting recommendation', error });
  }
});

// GET: Approve recommendation
app.get('/approve/:id', async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    recommendation.approvalStatus = 'approved';
    await recommendation.save();

    res.send('Recommendation approved successfully!');
  } catch (error) {
    res.status(500).json({ message: 'Error approving recommendation', error });
  }
});

app.get("/", (req, res) => {
  res.send("Backend server for recommendations is running successfully...");
});

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
