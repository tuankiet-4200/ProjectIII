const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

async function checkCart() {
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'kietnt@example.com' },
          { full_name: { contains: 'Kiet' } }
        ]
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`Found user: ${user.full_name} (${user.id})`);

    const cartKey = `cart:${user.id}`;
    const cartData = await redis.hgetall(cartKey);
    console.log('Cart data in Redis:', cartData);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    redis.disconnect();
  }
}

checkCart();
