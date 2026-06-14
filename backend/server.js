import express from 'express';
import 'dotenv/config';
import mongoose from 'mongoose';
import cors from 'cors';
// Load environment variables from .env file


import userRouter from './routes/userRouter.js';
import categoryRouter from './routes/categoryRouter.js';
import productRouter from './routes/productsRouter.js';
import purchaseRouter from './routes/purcheaseRouter.js';
import salesRouter from './routes/salesRouter.js';
import returnRouter from './routes/returnRouter.js';
import dashboardRouter from './routes/dashboardRouter.js';
import telegramRouter from './routes/telegramRouter.js';
import { startDailyReportScheduler } from "./services/Dailyreportscheduler.js";
import TelegramLongPolling from "./services/Telegramlongpolling.js";
import userAuth from "./middlewares/userAuth.js";

const app = express();

// enable for connecting frontend and backend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
}));

// Middleware to parse JSON bodies with larger limit
app.use(express.json({ limit: '50mb' }));

// Disable caching for API responses
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log(`   Content-Type: ${req.get('content-type')}`);
    console.log(`   Body: ${JSON.stringify(req.body)}`);
    next();
});


app.use('/uploads', express.static('uploads')); // Serve static files from the uploads directory

app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/purchases', purchaseRouter);
app.use('/api/sales', salesRouter);
app.use('/api/returns', returnRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/telegram', telegramRouter);



mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Connected to MongoDB');
    try {
        startDailyReportScheduler();
    } catch (err) {
        console.error('Error starting daily report scheduler:', err);
    }
    try {
        // Temporarily disable Telegram long-polling to reduce noisy logs during debugging
        // TelegramLongPolling.startPolling();
        console.log('Telegram long-polling is currently disabled for debugging');
    } catch (err) {
        console.error('Error starting Telegram long-polling service:', err);
    }
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});
// Define a simple route
app.get('/', (req, res) => {
    res.send('Hello World moaz!');
});
// Load environment variables from .env file
const PORT = process.env.PORT || 3000;
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});