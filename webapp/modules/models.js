const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_ADDRESS, { useCreateIndex: true, useNewUrlParser: true });

module.exports.User = mongoose.model('User', new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  email: { type: String },
  orcid: { type: String },
  isVerified: { type: Boolean, required: true, default: false }
}));

module.exports.Token = mongoose.model('Token', new mongoose.Schema({
  _userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: 'User' },
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, required: true, default: Date.now, expires: 86400 }
}));
