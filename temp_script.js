#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function query() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw`SELECT c.email, c.org_id FROM customers c WHERE c.email IN ('billing@techstart.com', 'payments@datacorp.com', 'eva.davis@example.com')`;
    console.log(result);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

query();