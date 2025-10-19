import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Test function for GET /api/accounts
const testGetAccounts = async () => {
  try {
    console.log('🔍 Testing GET /api/accounts...');
    const response = await axios.get(`${API_BASE_URL}/api/accounts`);
    
    console.log('✅ Accounts API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('---');
    
  } catch (error) {
    console.log('❌ Accounts API Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('Request Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
    console.log('---');
  }
};

// Test function for GET /api/posts
const testGetPosts = async () => {
  try {
    console.log('🔍 Testing GET /api/posts...');
    const response = await axios.get(`${API_BASE_URL}/api/posts`);
    
    console.log('✅ Posts API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('---');
    
  } catch (error) {
    console.log('❌ Posts API Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('Request Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
    console.log('---');
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting API Tests...');
  console.log('Base URL:', API_BASE_URL);
  console.log('=====================================');
  
  // Test both APIs
  await testGetAccounts();
  await testGetPosts();
  
  console.log('🏁 API Tests Completed!');
};

// Run the tests
runTests().catch(console.error);
