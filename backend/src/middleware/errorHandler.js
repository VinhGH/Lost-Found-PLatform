const errorHandler = (err, req, res, next) => {
  console.error('🔥 Global Error Handler:', err.stack || err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

export default errorHandler;
