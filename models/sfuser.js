import mongoose from 'mongoose';

const sfUserSchema = mongoose.Schema({
  _id: String,
  accessToken: String,
  refreshToken: String,
});

export default mongoose.model('SFUser', sfUserSchema);