import winston from "winston";
const { combine, timestamp, json, errors } = winston.format;

export const winstonLogger = winston.createLogger({
  level: "http",
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
  exitOnError: false,
});

if (process.env.NODE_ENV !== "production") {
  winstonLogger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export const winstonStream = {
  write: (message) => {
    winstonLogger.http(message.trim());
  },
};