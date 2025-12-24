/**
 * Audit Log Cleanup Script
 * 
 * This script manually removes old audit log entries based on retention policy.
 * 
 * SAFETY FEATURES:
 * - Dry-run mode by default (shows what would be deleted without deleting)
 * - Requires explicit confirmation
 * - Logs all operations
 * - Respects minimum retention period
 * 
 * USAGE:
 *   # Dry run (safe, shows what would be deleted)
 *   node scripts/cleanupAuditLogs.js
 * 
 *   # Actually delete old logs (requires --confirm flag)
 *   node scripts/cleanupAuditLogs.js --confirm
 * 
 *   # Custom retention period (days)
 *   node scripts/cleanupAuditLogs.js --days 60 --confirm
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminActivity from '../models/AdminActivity.js';
import { getRetentionCutoffDate, getRetentionDays, validateRetentionConfig, MINIMUM_RETENTION_DAYS } from '../config/auditRetention.js';
import { connectDB } from '../config/database.js';

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes('--confirm');
const daysArgIndex = args.indexOf('--days');
const customDays = daysArgIndex !== -1 && args[daysArgIndex + 1] 
  ? parseInt(args[daysArgIndex + 1], 10) 
  : null;

// Validate custom days if provided
if (customDays !== null && (customDays < MINIMUM_RETENTION_DAYS || customDays > 365)) {
  console.error(`❌ Error: Retention days must be between ${MINIMUM_RETENTION_DAYS} and 365`);
  process.exit(1);
}

// Validate retention configuration
const validation = validateRetentionConfig();
if (!validation.isValid) {
  console.error(`❌ Error: ${validation.message}`);
  process.exit(1);
}

const retentionDays = customDays || getRetentionDays();
const cutoffDate = getRetentionCutoffDate(retentionDays);

console.log('📊 Audit Log Cleanup Script');
console.log('='.repeat(50));
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (logs will be deleted)'}`);
console.log(`Retention Period: ${retentionDays} days`);
console.log(`Cutoff Date: ${cutoffDate.toISOString()}`);
console.log(`Current Date: ${new Date().toISOString()}`);
console.log('='.repeat(50));
console.log('');

// Connect to database
console.log('🔄 Connecting to database...');
try {
  await connectDB();
  console.log('✅ Database connected\n');
} catch (error) {
  console.error('❌ Failed to connect to database:', error.message);
  process.exit(1);
}

// Count logs to be deleted
console.log('📈 Analyzing audit logs...');
try {
  const totalLogs = await AdminActivity.countDocuments({});
  const logsToDelete = await AdminActivity.countDocuments({
    createdAt: { $lt: cutoffDate }
  });
  const logsToKeep = totalLogs - logsToDelete;

  console.log(`Total audit logs: ${totalLogs.toLocaleString()}`);
  console.log(`Logs to delete: ${logsToDelete.toLocaleString()} (older than ${retentionDays} days)`);
  console.log(`Logs to keep: ${logsToKeep.toLocaleString()}`);
  console.log('');

  if (logsToDelete === 0) {
    console.log('✅ No logs need to be deleted. All logs are within retention period.');
    await mongoose.connection.close();
    process.exit(0);
  }

  // Show sample of logs that would be deleted
  if (logsToDelete > 0) {
    console.log('📋 Sample of logs that would be deleted:');
    const sampleLogs = await AdminActivity.find({
      createdAt: { $lt: cutoffDate }
    })
      .sort({ createdAt: 1 })
      .limit(5)
      .select('action createdAt adminId')
      .lean();

    sampleLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.action} - ${new Date(log.createdAt).toISOString()}`);
    });
    if (logsToDelete > 5) {
      console.log(`  ... and ${logsToDelete - 5} more`);
    }
    console.log('');
  }

  // Dry run mode
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE: No logs were deleted.');
    console.log('To actually delete logs, run with --confirm flag:');
    console.log(`  node scripts/cleanupAuditLogs.js --confirm`);
    if (customDays) {
      console.log(`  node scripts/cleanupAuditLogs.js --days ${customDays} --confirm`);
    }
    await mongoose.connection.close();
    process.exit(0);
  }

  // Live mode - actually delete
  console.log('🗑️  Deleting old audit logs...');
  const deleteResult = await AdminActivity.deleteMany({
    createdAt: { $lt: cutoffDate }
  });

  console.log('');
  console.log('✅ Cleanup completed successfully!');
  console.log(`   Deleted: ${deleteResult.deletedCount.toLocaleString()} logs`);
  console.log(`   Remaining: ${logsToKeep.toLocaleString()} logs`);
  console.log('');
  console.log('📝 This operation has been logged. Consider backing up your database.');

} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
} finally {
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
}

