const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {app,server} = require('./socket/socket');

// const { app, server} = createSocketServer();

require('dotenv').config();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: "*", // Allow only frontend requests from this origin
    credentials: true, // Optional if you're using cookies or authentication headers
}));





require('dotenv').config();

const PORT = process.env.PORT||4000; 

server.listen(PORT, () => {
    console.log('App started at port no ', PORT);
})
const { connectDB } = require('./config/database')
connectDB();

const { cloudinaryConnect } = require('./config/cloudinary');
cloudinaryConnect();

const userRoute = require('./routes/userRoutes');
const messageRoute = require('./routes/messageRoutes');
const postRoute = require('./routes/postRoutes');

app.use('/api/v1/user', userRoute);
app.use('/api/v1/message', messageRoute);
app.use('/api/v1/post', postRoute);

app.get('/', (req, res) => {
    res.send('<H1>Hello ji this is love babber</H1>');
})
