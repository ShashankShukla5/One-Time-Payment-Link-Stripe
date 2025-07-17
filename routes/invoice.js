import express from 'express';
import Payment from '../models/Payment.js';

const router = express.Router();

// router.get('/', async (req, res) => {
//   const email = req.query.email;

//   if (!email) {
//     return res.status(400).json({ error: 'Email parameter is required.' });
//   }

//   try {
//     const payments = await Payment.find({ email });

//     const formatted = payments.map(payment => ({
//       invoice_id: payment.invoiceId || null,
//       email: payment.email,
//       amount: (payment.amountCents / 100).toFixed(2),
//       status: payment.status,
//       created_at: payment.createdAt,
//       expiry_at: payment.expiresAt,
//       paid_at: payment.paidAt || null
//     }));

//     res.json({ success: true, payments: formatted });
//   } catch (err) {
//     console.error('Error fetching invoices:', err);
//     res.status(500).json({ error: 'Server error while fetching invoices.' });
//   }
// });

router.get('/', async (req, res) => {
  const { email, status, startDate, endDate } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }

  try {
    const query = { email };

    // Optional: Filter by status
    if (status) {
      query.status = status;
    }

    // Optional: Filter by date range
    if (startDate) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      query.expiresAt = query.expiresAt || {};
      query.expiresAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query);

    const formatted = payments.map(payment => ({
      id: payment.id,
      amount: payment.amountCents / 100,
      status: payment.status,
      createdAt: payment.createdAt,
      expiresAt: payment.expiresAt,
      paidAt: payment.paidAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Server error while fetching invoices.' });
  }
});


export default router;