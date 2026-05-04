const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDB() {
  console.log('Clearing DB...');
  await prisma.credential.deleteMany({});
  await prisma.credentialDefinition.deleteMany({});
  await prisma.attribute.deleteMany({});
  await prisma.schema.deleteMany({});
  console.log('DB cleared!');
}

clearDB()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
