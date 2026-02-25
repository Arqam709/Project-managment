import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon serverless WebSocket support
neonConfig.webSocketConstructor = ws;

// If deploying to edge environments later, you could enable:
// neonConfig.poolQueryViaFetch = true;

const connectionString = `${process.env.DATABASE_URL}`;

// Create Neon adapter
const adapter = new PrismaNeon({ connectionString });

// Create Prisma client with adapter
const prisma = global.prisma || new PrismaClient({ adapter });

// Prevent multiple Prisma instances in development (hot reload fix)
if (process.env.NODE_ENV !== 'development') {
  global.prisma = prisma;
}

export default prisma;