import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing auth header' });

  const token = authHeader.split(' ')[1];

  console.log('JWT_SECRET:', JWT_SECRET);
  console.log('Incoming token:', token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    console.log('JWT verification failed');
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default authMiddleware;
