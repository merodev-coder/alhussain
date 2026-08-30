import pino from 'pino';
const isProduction = process.env.NODE_ENV === 'production';
// Create a pino logger instance
export const logger = pino({
    level: isProduction ? 'warn' : 'info', // Reduce logging in production
    transport: isProduction
        ? undefined // Use default transport in production (structured JSON)
        : {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
});
// Helper functions for common logging patterns
export const logError = (context, error) => {
    logger.error({ context, error: error instanceof Error ? error.message : String(error) });
};
export const logInfo = (context, message, data) => {
    logger.info({ context, message, ...data });
};
export const logWarn = (context, message, data) => {
    logger.warn({ context, message, ...data });
};
