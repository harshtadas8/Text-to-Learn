import { logger } from "../config/logger.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Orchestrator } from '../services/ai/Orchestrator.js';
import connectDB from '../config/db.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEvals() {
  await connectDB();
  
  logger.info("======================================");
  logger.info("   STARTING AI COURSE EVALUATIONS   ");
  logger.info("======================================");

  const datasetPath = path.join(__dirname, 'eval_dataset.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  
  const orchestrator = new Orchestrator();
  
  let passed = 0;
  let failed = 0;
  let totalLatency = 0;
  
  for (let i = 0; i < dataset.length; i++) {
    const data = dataset[i];
    logger.info(`\n[Test ${i + 1}/${dataset.length}] Topic: "${data.topic}" (${data.language})`);
    
    const startTime = Date.now();
    try {
      // Orchestrator automatically calls the EvaluatorAgent and does validation
      const course = await orchestrator.createValidatedCourse(
        data.topic,
        data.level,
        data.language,
        data.goal,
        data.timeAvailable,
        null, // no user memory
        '',   // no source material
        2     // maxRetries = 2 to allow self-healing
      );
      
      const latency = Date.now() - startTime;
      totalLatency += latency;
      
      // Additional structural checks
      if (!course.modules || course.modules.length === 0) {
        throw new Error("Validation Failed: Output has no modules");
      }
      
      logger.info(`-? PASS - Generated ${course.modules.length} modules in ${(latency / 1000).toFixed(2)}s`);
      passed++;
      
    } catch (err) {
      logger.error(`-? FAIL - Error: ${err.message}`);
      failed++;
    }
  }
  
  logger.info("\n======================================");
  logger.info("           EVALUATION SUMMARY         ");
  logger.info("======================================");
  logger.info(`Total Run: ${dataset.length}`);
  logger.info(`Passed: ${passed}`);
  logger.info(`Failed: ${failed}`);
  logger.info(`Pass Rate: ${((passed / dataset.length) * 100).toFixed(1)}%`);
  logger.info(`Avg Latency: ${((totalLatency / passed) / 1000).toFixed(2)}s per successful run`);
  
  // Wait for any async DB operations (AIUsage logs) to finish before closing
  await new Promise(resolve => setTimeout(resolve, 1500));
  await mongoose.connection.close();
  
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runEvals();
