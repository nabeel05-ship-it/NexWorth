import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    targetAmount: {
      type: Number,
      required: true,
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    targetDate: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
  },
  { timestamps: true }
);

export const Goal = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
export default Goal;
