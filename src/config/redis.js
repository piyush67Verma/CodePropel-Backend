const redis = require('redis');

const redisClient = redis.createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-18551.crce281.ap-south-1-3.ec2.cloud.redislabs.com',
        port: 18551
    }
})


module.exports = redisClient;