const errorHandler = (err, req, res, _next) => {
  console.error('🔥 Global Error Handler:', err.stack || err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

export default errorHandler;
