import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

async function connectDB() {
  await mongoose.connect(mongoUri);
  console.log('Worker: MongoDB connected');
}

// Lazy imports to avoid circular deps
async function processAssignment(job: Job) {
  const { Assignment } = await import('../models/Assignment');
  const { generateQuestionPaper } = await import('../services/aiService');
  const { setJobState } = await import('../services/queue');

  const { assignmentId, fileContent } = job.data;

  console.log(`Processing assignment: ${assignmentId}`);

  await setJobState(job.id!, { status: 'processing', progress: 10 });

  // Update status in DB
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  assignment.status = 'processing';
  await assignment.save();

  await setJobState(job.id!, { status: 'processing', progress: 30 });

  // Generate question paper
  const paper = await generateQuestionPaper({
    questionTypes: assignment.questionTypes,
    additionalInfo: assignment.additionalInfo,
    dueDate: assignment.dueDate,
    fileContent,
  });

  await setJobState(job.id!, { status: 'processing', progress: 80 });

  // Save result
  assignment.generatedPaper = paper;
  assignment.status = 'completed';
  await assignment.save();

  await setJobState(job.id!, { status: 'completed', progress: 100, assignmentId });

  console.log(`Assignment ${assignmentId} completed`);
  return { assignmentId, status: 'completed' };
}

async function startWorker() {
  await connectDB();

  const worker = new Worker(
    'assignment-generation',
    async (job: Job) => {
      return processAssignment(job);
    },
    {
      connection,
      concurrency: 3,
    }
  );

  worker.on('completed', async (job) => {
    console.log(`Job ${job.id} completed`);
    // Notify via HTTP or directly via wsManager if in same process
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    console.error(`Job ${job.id} failed:`, err.message);

    try {
      const { Assignment } = await import('../models/Assignment');
      await Assignment.findByIdAndUpdate(job.data.assignmentId, {
        status: 'failed',
        error: err.message,
      });
    } catch {}
  });

  console.log('Worker started, waiting for jobs...');
}

startWorker().catch(console.error);

export {};
