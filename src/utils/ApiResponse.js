class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
  }

  static success(data = null, message = 'Request was successful') {
    return new ApiResponse(200, message, data);
  }

  static error(message = 'An error occurred', status = 500) {
    return new ApiResponse(status, message);
  }
}

export {ApiResponse}