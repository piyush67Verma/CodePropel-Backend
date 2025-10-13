require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/userAuth');
const problemRouter = require('./routes/problemRoute');
const redisClient = require('./config/redis');
const submitRouter = require('./routes/submitRoute');
const cors = require('cors');
const aiRouter = require('./routes/aiChatting');

const app = express();

//CORS for both local + production frontend
app.use(cors({
    origin: ["https://code-propel-frontend.vercel.app"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

//Test endpoint
app.get('/check', (req, res) => {
    res.send("Server running correctly!");
});

//Routers
app.use('/auth', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);

//DB and Redis connection
const initializeConnection = async () => {
    try {
        await Promise.all([redisClient.connect(), main()]);
        console.log("DB & Redis connected successfully");

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Error initializing server:", err);
        process.exit(1);
    }
};

initializeConnection();
