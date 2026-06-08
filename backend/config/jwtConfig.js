import jwt from 'jsonwebtoken';
import "dotenv/config";

const generateToken = (payload) => {
    if (!process.env.jwt_secret) {
        throw new Error('JWT secret not configured');
    }
    return jwt.sign(payload, process.env.jwt_secret, { expiresIn: '7d' });
};

export default generateToken;