import cron from "node-cron";
import { truncate, copyFile } from "fs/promises";
import { winstonLogger } from "../config/logger.js";

const errorLog = "logs/error.log";
const combinedLog = "logs/combined.log";
const backupErrorLog = "logs/last-week_error.log";
const backupCombinedLog = "logs/last-week_combined.log";

const backupAndClear = async (originalFile, backupFile) => {
  try {
    await copyFile(originalFile, backupFile);
    winstonLogger.info(`[CRON-weekly-cleanup backed up "${originalFile}" to "${backupFile}"`);

    await truncate(originalFile, 0);
    winstonLogger.info(`[CRON-weekly-cleanup] cleared "${originalFile}"`);
  } catch (error) {
    if (error.code === "ENOENT") {
      winstonLogger.info(`[CRON-weekly-cleanup] log file "${originalFile}" not found`);
    } else {
      winstonLogger.error(`[CRON-weekly-cleanup] failed to backup/clear "${originalFile}": ${error}`);
    }
  }
};

const deleteBackup = async (backupFile) => {
  try {
    await truncate(backupFile, 0);
    winstonLogger.info(`[CRON-2weeks-cleanup] cleared old backup: "${backupFile}"`);
  } catch (error) {
    if (error.code === "ENOENT") {
      winstonLogger.info(`[CRON-2weeks-cleanup] old backup "${backupFile}" not found`);
    } else {
      winstonLogger.error(`[CRON-2weeks-cleanup] failed to delete backup "${backupFile}": ${error}`);
    }
  }
};


const startLogsCleanerSchedule = () => {
  
  // Schedule: Every week [1st, 8th, 15th, and 22th of every month] at 5:00 AM ("0 5 1,8,15,22 * *")
  cron.schedule("0 5 1,8,15,22 * *", async () => {
    winstonLogger.info("[CRON-weekly-cleanup] starting weekly log backup and cleanup task");
    
    await backupAndClear(errorLog, backupErrorLog);
    await backupAndClear(combinedLog, backupCombinedLog);
    
    winstonLogger.info("[CRON-weekly-cleanup] log files backup and cleanup task finished");
  });

  // Schedule: Every 2 weeks [1st and 15th of every month] at 4:50 AM ("50 4 1,15 * *")
  cron.schedule("50 4 1,15 * *", async () => {
    winstonLogger.info("[CRON-2weeks-cleanup] starting cleanup of old log files task");

    await deleteBackup(backupErrorLog);
    await deleteBackup(backupCombinedLog);

    winstonLogger.info("[CRON-2weeks-cleanup] cleanup of old log files task finished");
  });

  winstonLogger.info("[CRON] starting logs cleaner schedules");
};

export default startLogsCleanerSchedule;