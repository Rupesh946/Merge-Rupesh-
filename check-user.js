const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { username: 'Rupesh946' },
        include: {
            _count: {
                select: {
                    followers: true,
                    following: true,
                    projects: true,
                    posts: true
                }
            }
        }
    });
    console.log(JSON.stringify(user, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
