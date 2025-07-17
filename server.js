import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import paymentRoutes from './routes/payments.js';
import userRoutes from './routes/users.js';
import invoiceRoutes from './routes/invoice.js';
import { scheduleExpiryChecks } from './utils/scheduler.js';
import Payment from './models/Payment.js';
import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 5000;
const ALTERNATIVE_PORT = 5001; // Alternative port if default is in use

// CORS configuration
app.use(cors({
  origin: '*', 
}));

// Important: Raw body parser for Stripe webhooks must come before JSON parser
// Handle webhook route separately to preserve raw body
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed' || event.type === 'payment_link.completed') {
    const session = event.data.object;
    const paymentId = session.metadata.paymentId;
    const customerId = session.metadata.customer_id;
    const email = session.metadata?.email;
    const finalizedInvoiceId = session.metadata?.finalizedInvoiceId;

    // console.log(session)

    console.log("Customer Id: ", customerId)

    if (paymentId) {
      await Payment.findOneAndUpdate(
        { id: paymentId },
        {
          status: 'paid',
          paidAt: new Date(),
          stripePaymentIntentId: session.id
        }
      );
    }

    console.log('Retrieved PI amount:', session.amount_total);

    // const draftInvoice = await stripe.invoices.create({
    //   customer: customerId,
    //   auto_advance: false,
    //   pending_invoice_items_behavior: 'exclude',
    // });

    // await stripe.invoiceItems.create({
    //   customer: customerId,
    //   invoice: draftInvoice.id, // This links it to the specific invoice
    //   amount: session.amount_total,
    //   currency: session.currency,
    //   description: 'Invoice for one-time payment via payment link',
    // });

    // const finalizedInvoice = await stripe.invoices.finalizeInvoice(draftInvoice.id);

    // // await stripe.invoices.pay(finalizedInvoice.id, {
    // //   payment_intent: session.payment_intent, // Use the Checkout Session's payment intent
    // // });

    await stripe.invoices.pay(finalizedInvoiceId, {
      paid_out_of_band: true, // Indicates payment was received outside Stripe
    });

    // // 3. Wait for invoice_pdf
    // let invoice = finalizedInvoice;
    // for (let i = 0; i < 5; i++) {
    //   invoice = await stripe.invoices.retrieve(finalizedInvoice.id);
    //   if (invoice.invoice_pdf) break;
    //   await new Promise(res => setTimeout(res, 1000)); // wait 1s
    // }

    // if (!invoice.invoice_pdf) {
    //   throw new Error('Invoice PDF not available after waiting');
    // }

    // // // 4. Download invoice PDF
    // const pdfResponse = await axios.get(invoice.invoice_pdf, {
    //   responseType: 'arraybuffer'
    // });

    // const pdfBuffer = pdfResponse.data;

    // console.log('Invoice created:', invoice.id);



    // await sendPaymentSuccessEmail(email, (session.amount_total / 100).toFixed(2), paymentId, pdfBuffer);

    // await stripe.paymentIntents.update(session.payment_intent, {
    //   receipt_email: email, // Auto-sends receipt
    // });

    console.log(`Payment success email sent to ${email}`);
  }

  if(event.type === 'invoice.paid') {
    const session = event.data.object;
    const paymentId = session.metadata.paymentId;

    if (paymentId) {
      await Payment.findOneAndUpdate(
        { id: paymentId },
        {
          status: 'paid',
          paidAt: new Date(),
          stripePaymentIntentId: session.id
        }
      );
    }

    console.log('session: ', session)
  }

  res.json({ received: true });
});

// Parse JSON for all other routes
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payment-links')
  .then(() => {
    console.log('Connected to MongoDB');
    // Start expiry check scheduler
    scheduleExpiryChecks();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes - exclude webhook path from regular routes
app.use('/api/payments', (req, res, next) => {
  if (req.path === '/webhook') {
    return res.status(404).json({ error: 'Route not found' });
  }
  next();
}, paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invoice', invoiceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// // Try to start the server with error handling
// const startServer = (port) => {
//   return new Promise((resolve, reject) => {
//     const server = app.listen(port)
//       .once('listening', () => {
//         console.log(`Server running on port ${port}`);
//         resolve(server);
//       })
//       .once('error', (err) => {
//         reject(err);
//       });
//   });
// };

// // Try primary port first, then fallback to alternative
// startServer(PORT)
//   .catch(err => {
//     if (err.code === 'EADDRINUSE') {
//       console.log(`Port ${PORT} is already in use, trying alternative port ${ALTERNATIVE_PORT}`);
//       return startServer(ALTERNATIVE_PORT);
//     }
//     throw err;
//   })
//   .catch(err => {
//     console.error('Failed to start server:', err);
//     process.exit(1);
//   });

const startServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0')
      .once('listening', () => {
        console.log(`Server running on port ${port}`);
        resolve(server);
      })
      .once('error', (err) => {
        reject(err);
      });
  });
};

startServer(PORT)
  .catch(err => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is already in use, trying alternative port ${ALTERNATIVE_PORT}`);
      return startServer(ALTERNATIVE_PORT);
    }
    throw err;
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
