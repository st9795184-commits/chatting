const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
// If you have neppayments installed, uncomment below; otherwise install it:
// const { NepPayments } = require('neppayments');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ========== DATABASE (writable location on Render) ==========
const db = new sqlite3.Database('/tmp/database.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        customer_phone TEXT,
        customer_address TEXT,
        items TEXT,
        total_amount INTEGER,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        order_status TEXT DEFAULT 'pending',
        order_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        customer_phone TEXT,
        reservation_date TEXT,
        reservation_time TEXT,
        guests INTEGER,
        status TEXT DEFAULT 'pending'
    )`);
});

// ========== ORDER & RESERVATION APIs ==========
app.post('/api/orders', (req, res) => {
    const { customer_name, customer_phone, customer_address, items, total_amount, payment_method } = req.body;
    db.run(
        `INSERT INTO orders (customer_name, customer_phone, customer_address, items, total_amount, payment_method) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [customer_name, customer_phone, customer_address, JSON.stringify(items), total_amount, payment_method],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, orderId: this.lastID });
        }
    );
});

app.get('/api/orders', (req, res) => {
    db.all('SELECT * FROM orders ORDER BY order_time DESC', (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(orders);
    });
});

app.put('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    db.run('UPDATE orders SET order_status = ? WHERE id = ?', [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/reservations', (req, res) => {
    const { customer_name, customer_phone, reservation_date, reservation_time, guests } = req.body;
    db.run(
        `INSERT INTO reservations (customer_name, customer_phone, reservation_date, reservation_time, guests) 
         VALUES (?, ?, ?, ?, ?)`,
        [customer_name, customer_phone, reservation_date, reservation_time, guests],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, reservationId: this.lastID });
        }
    );
});

// ========== eSEWA & KHALTI PAYMENT INITIATION (SANDBOX) ==========
// If you have `neppayments` installed, use it; otherwise we implement simple redirects.
// For simplicity, I'll provide the direct redirect URLs (test mode).

// Khalti test initiation endpoint
app.post('/api/initiate-khalti', (req, res) => {
    const { amount, orderId, customerName, customerEmail, customerPhone } = req.body;
    // amount is in rupees, Khalti expects paisa (multiply by 100)
    const amountInPaisa = amount * 100;
    // Test URL for Khalti (sandbox). In production, use live URL and secret key.
    const paymentUrl = `https://test-payment.khalti.com/?pidx=dummy&amount=${amountInPaisa}&order_id=${orderId}`;
    res.json({ success: true, payment_url: paymentUrl });
});

// eSewa test initiation endpoint
app.post('/api/initiate-esewa', (req, res) => {
    const { amount, orderId } = req.body;
    // eSewa test payment URL (sandbox)
    const esewaUrl = `https://rc-epay.esewa.com.np/api/epay/main/v2/form?amount=${amount}&tax_amount=0&total_amount=${amount}&transaction_uuid=${orderId}&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=http://localhost:3000/payment-success&failure_url=http://localhost:3000/payment-failure`;
    res.json({ success: true, payment_url: esewaUrl });
});

// Payment success & failure pages (simple)
app.get('/payment-success', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Payment Successful</title></head>
        <body style="text-align:center; padding:50px;">
            <h1>✅ Payment Successful!</h1>
            <p>Your order has been confirmed.</p>
            <a href="/">Return to Home</a>
        </body>
        </html>
    `);
});

app.get('/payment-failure', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Payment Failed</title></head>
        <body style="text-align:center; padding:50px;">
            <h1>❌ Payment Failed</h1>
            <p>Please try again.</p>
            <a href="/order.html">Go back to order</a>
        </body>
        </html>
    `);
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`✅ Foodstuff server running on port ${PORT}`);
});

