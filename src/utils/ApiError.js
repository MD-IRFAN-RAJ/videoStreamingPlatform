class ApiError extends Error {
  constructor(statusCode,message="Something went wrong",errors=[],statck="") {
    super(message);
    this.statusCode = statusCode;
    this.data=null;
    this.message = message;
    this.errors = error;
    this.success = false; 
    
    if(statck) {
      this.stack = statck;
    }else{
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
// Usage example:
// throw new ApiError(404, "Resource not found", ["Invalid ID"], "Stack trace here");
// throw new ApiError(500, "Internal Server Error", [], "Stack trace here");
// throw new ApiError(400, "Bad Request", ["Missing parameters"], "Stack trace here");
// throw new ApiError(401, "Unauthorized", [], "Stack trace here");
// throw new ApiError(403, "Forbidden", [], "Stack trace here");
// throw new ApiError(422, "Unprocessable Entity", ["Validation failed"], "Stack trace here");
// throw new ApiError(408, "Request Timeout", [], "Stack trace here");
// throw new ApiError(429, "Too Many Requests", [], "Stack trace here");
// throw new ApiError(500, "Internal Server Error", [], "Stack trace here");