const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Thread Schema
const replySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  delete_password: {
    type: String,
    required: true
  },
  created_on: {
    type: Date,
    default: Date.now
  },
  reported: {
    type: Boolean,
    default: false
  }
});

const threadSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  delete_password: {
    type: String,
    required: true
  },
  board: {
    type: String,
    required: true
  },
  created_on: {
    type: Date,
    default: Date.now
  },
  bumped_on: {
    type: Date,
    default: Date.now
  },
  reported: {
    type: Boolean,
    default: false
  },
  replies: [replySchema],
  replycount: {
    type: Number,
    default: 0
  }
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = { Thread };