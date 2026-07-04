const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      }
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID_FORMAT',
        message: `Invalid resource ID format for path: ${err.path}`,
      }
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: 'A resource with this key already exists.',
      }
    });
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong on the server',
    }
  });
};

module.exports = errorHandler;
