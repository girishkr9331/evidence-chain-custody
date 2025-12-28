import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import evidenceRoutes from './routes/evidence.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/evidence-custody';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Import archive routes
import archiveRoutes from './routes/archive.js';
import userRoutes from './routes/users.js';
import auditLogRoutes from './routes/auditLog.js';
import commentRoutes from './routes/comments.js';
import alertRoutes from './routes/alerts.js';
import registrationRequestRoutes from './routes/registrationRequests.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/registration-requests', registrationRequestRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Evidence Chain API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
