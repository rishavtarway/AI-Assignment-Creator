import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { Worker, Job } from 'bullmq';

dotenv.config();

import assignmentRoutes from './routes/assignments';
import { wsManager } from './services/wsManager';
import { redis } from './services/queue';
import { createRedisClient } from './services/redisClient';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/assignments', assignmentRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 + Error handlers (must be after routes)
app.use(notFound);
app.use(errorHandler);

// WebSocket
wsManager.init(server);

// Inline Worker (for simplicity in single-server mode)
const workerConnection = createRedisClient();

workerConnection.on('error', (err) => {
  console.error('[Worker Redis] Error:', err);
});

workerConnection.on('connect', () => {
  console.log('[Worker Redis] Connected');
});


const worker = new Worker(
  'assignment-generation',
  async (job: Job) => {
    const { Assignment } = await import('./models/Assignment');
    const { generateQuestionPaper } = await import('./services/aiService');

    const { assignmentId, fileContent } = job.data;
    console.log(`Processing job for assignment: ${assignmentId}`);

    wsManager.notifyAssignment(assignmentId, { status: 'processing', progress: 20 });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    wsManager.notifyAssignment(assignmentId, { status: 'processing', progress: 40 });

    const paper = await generateQuestionPaper({
      questionTypes: assignment.questionTypes,
      additionalInfo: assignment.additionalInfo,
      dueDate: assignment.dueDate,
      fileContent,
    });

    wsManager.notifyAssignment(assignmentId, { status: 'processing', progress: 85 });

    assignment.generatedPaper = paper;
    assignment.status = 'completed';
    await assignment.save();

    wsManager.notifyAssignment(assignmentId, { status: 'completed', progress: 100 });

    return { assignmentId, status: 'completed' };
  },
  { connection: workerConnection, concurrency: 3 }
);

worker.on('failed', async (job, err) => {
  if (!job) return;
  console.error(`Job ${job.id} failed:`, err.message);
  try {
    const { Assignment } = await import('./models/Assignment');
    await Assignment.findByIdAndUpdate(job.data.assignmentId, {
      status: 'failed',
      error: err.message,
    });
    wsManager.notifyAssignment(job.data.assignmentId, { status: 'failed', error: err.message });
  } catch {}
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });

export {};
