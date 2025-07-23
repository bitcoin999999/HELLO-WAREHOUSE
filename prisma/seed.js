// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1) 4개의 선반 upsert
  for (let num = 1; num <= 4; num++) {
    await prisma.shelf.upsert({
      where: { number: num },
      update: {},
      create: { number: num },
    });
  }

  // 2) 각 선반마다 4개의 층 upsert
  const shelves = await prisma.shelf.findMany();
  for (const shelf of shelves) {
    for (let lvl = 1; lvl <= 4; lvl++) {
      await prisma.level.upsert({
        where: { shelfId_number: { shelfId: shelf.id, number: lvl } },
        update: {},
        create: {
          number: lvl,
          shelfId: shelf.id,
        },
      });
    }
  }

  console.log('🎉 Seed finished!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
