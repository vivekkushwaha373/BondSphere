const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
      
        if (!token) {
            return res.status(401).json({
                message: 'User not authenticated',
                success:false
            })
        }
        
        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        if (!decode) {
            console.log('Token is invalid');
            return res.status(401).json({
                message: "Invalid token",
                success:false
            })
        }
        
        req.user = decode;
        
        next();
    }
    catch (error) {
        console.log('what: ', error.message);
        return res.status(500).json({
            message: "Interva Server Error",
            success:false
        })
    }
}