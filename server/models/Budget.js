import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
    },
    limit: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
export default Budget;
