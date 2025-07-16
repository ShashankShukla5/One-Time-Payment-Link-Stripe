import express from 'express';
import Payment from '../models/Payment.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }

  try {
    const payments = await Payment.find({ email });

    const formatted = payments.map(payment => ({
      invoice_id: payment.invoiceId || null,
      email: payment.email,
      amount: (payment.amountCents / 100).toFixed(2),
      status: payment.status,
      created_at: payment.createdAt,
      expiry_at: payment.expiresAt,
      paid_at: payment.paidAt || null
    }));

    res.json({ success: true, payments: formatted });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Server error while fetching invoices.' });
  }
});

export default router;