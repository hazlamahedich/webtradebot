// Mock for the code-review module
module.exports = {
  startCodeReviewFlow: jest.fn().mockResolvedValue({ success: true }),
  executeCodeReview: jest.fn().mockResolvedValue({ result: {} }),
  // Add any other functions exported by the actual module
}; 