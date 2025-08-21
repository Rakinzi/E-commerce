import cluster from 'cluster';
import { cpus } from 'os';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import logger from './utils/logger.js';
import redis from './config/redis.js';

const numCPUs = cpus().length;
const PORT = env.PORT || 3000;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close Redis connection
    await redis.quit();
    logger.info('Redis connection closed');
    
    // Close database connection (handled by mongoose)
    logger.info('Database connection closed');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Connect to Redis
    await redis.connect();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`📊 Worker ${process.pid} started`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Graceful shutdown for server
    const shutdown = () => {
      server.close(async () => {
        logger.info('HTTP server closed');
        await gracefulShutdown('SERVER_SHUTDOWN');
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Clustering logic
if (env.NODE_ENV === 'production' && cluster.isPrimary) {
  logger.info(`🎯 Master ${process.pid} is running`);
  logger.info(`🖥️  Starting ${numCPUs} workers`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker death
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`⚠️  Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    logger.info('🔄 Starting a new worker');
    cluster.fork();
  });

  // Handle master process signals
  process.on('SIGTERM', () => {
    logger.info('🛑 Master received SIGTERM, shutting down workers');
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill();
    }
  });

  process.on('SIGINT', () => {
    logger.info('🛑 Master received SIGINT, shutting down workers');
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill();
    }
  });

} else {
  // Worker process or development mode
  startServer();
}

export { app };