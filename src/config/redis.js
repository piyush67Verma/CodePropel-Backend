const redis = require('redis');

const redisClient = redis.createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        // host: 'redis-19391.crce182.ap-south-1-1.ec2.redns.redis-cloud.com',
        host: 'redis-19733.c305.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 19733
    }
})


module.exports = redisClient;