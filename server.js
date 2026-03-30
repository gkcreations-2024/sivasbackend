const express = require('express');
const multer = require('multer');
// const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const cors = require('cors'); // Import CORS middleware
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // Use in-memory storage

// Enable CORS for all origins
app.use(cors());

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
const resend = new Resend(process.env.RESEND_API_KEY);

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.PASSWORD
//     }
// });
app.post("/place-order", async (req, res) => {
  try {
    const { customerDetails, cartDetails, totalAmount } = req.body;

    // 🔥 Bill Number generate
    const today = new Date();
    const billNo = `SPP-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}-${Math.floor(100+Math.random()*900)}`;

    const newOrder = new Order({
      billNo,
      customerDetails,
      cartDetails,
      totalAmount
    });

    await newOrder.save();

    res.json({
      success: true,
      billNo
    });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});
app.post('/send-email', upload.single('pdf'), async (req, res) => {
    const customerEmail = req.body.customerEmail;
    const pdf = req.file;

    if (!pdf) {
        return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    try {
        const data = await resend.emails.send({
            from: 'Sivas Pyro Paradise <orders@sivaspyroparadise.com>',  // later own domain verify panna maathunga
            to: customerEmail,
            bcc: 'sivaspyroparadise2026@gmail.com',
            subject: 'Order Confirmation',
            text: 'Please find the attached invoice.',
            attachments: [
                {
                    filename: 'order-summary.pdf',
                    content: pdf.buffer.toString("base64"), // Resend expects base64
                },
            ],
        });

        console.log("Email sent:", data);
        res.json({ success: true });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: 'Error sending email' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
