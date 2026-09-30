import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    merchant: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Other',
    },
    date: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0],
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'NetBanking', 'AutoPay', 'Other'],
      default: 'UPI',
    },
    source: {
      type: String,
      enum: ['manual', 'cash', 'sms', 'notification', 'email', 'import'],
      default: 'manual',
    },
    note: {
      type: String,
      default: '',
    },
    reference: {
      type: String,
      default: '',
    },
    rawMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
export default Expense;
