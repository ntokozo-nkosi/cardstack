/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */

// Mock Prisma client for build time
class MockPrismaClient {
  deck = {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => data,
    update: async (data: any) => data,
    delete: async () => ({ success: true }),
  }
  card = {
    create: async (data: any) => data,
    update: async (data: any) => data,
    delete: async () => ({ success: true }),
  }
}

// Use dynamic require to avoid build-time initialization errors
let PrismaClient: any

// Check if we're in a build/compilation phase
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL

try {
  if (isBuildTime) {
    throw new Error('Build time - using mock')
  }
  const prismaModule = require('@prisma/client')
  PrismaClient = prismaModule.PrismaClient
} catch {
  // Fallback for build time when client isn't generated
  PrismaClient = MockPrismaClient
}

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
