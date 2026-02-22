/**
 * Global error-handling middleware.
 * Must be registered last (after all routes) in the Express app.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.stack,
    });
}

module.exports = errorHandler;