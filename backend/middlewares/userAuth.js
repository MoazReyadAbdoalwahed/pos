import jwt from 'jsonwebtoken';
import "dotenv/config";

const userAuth = (req, res, next) => {
    console.log('Checking user authentication...', req.headers.authorization);
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        if (!process.env.jwt_secret) {
            return res.status(500).json({ message: 'Server error: JWT secret not configured' });
        }

        const decoded = jwt.verify(token, process.env.jwt_secret);
        req.user = decoded;

        next(); // استدعاء قياسي ونظيف داخل نطاق الدالة

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token has expired' });
        }
        console.error('Authentication error:', err);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

export default userAuth;