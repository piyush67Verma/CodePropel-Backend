const redis = require('redis');

const redisClient = redis.createClient({
    username: 'default',
    password: 'process.env.REDIS_PASSWORD',
    socket: {
        host: 'redis-16347.c11.us-east-1-3.ec2.cloud.redislabs.com',
        port: 16347
    }
});

module.exports = redisClient;