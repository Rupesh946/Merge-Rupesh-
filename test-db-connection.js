const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('Testing database connection...');
    try {
        const start = Date.now();
        await prisma.$connect();
        console.log(`Connected to database in ${Date.now() - start}ms`);

        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('Query result:', result);

        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);

        console.log('Database connection successful!');
    } catch (e) {
        console.error('Database connection failed:');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
