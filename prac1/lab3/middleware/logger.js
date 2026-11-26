const crypto = require('crypto');

const requestLogger = (req, res, next) => {
    const requestId = crypto.randomUUID();
    req.requestId = requestId;
    console.log(`[${requestId}] ${req.method} ${req.url}`);
    res.setHeader('X-Request-ID', requestId);
    next();
}

module.exports = requestLogger;