const jwt = require('jsonwebtoken');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;

    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Invalid token'));
  }
};

module.exports = socketAuth;
