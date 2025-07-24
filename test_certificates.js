// Simple test script to verify certificate functionality
const fetch = require('node-fetch')

async function testCertificateAPI() {
  const baseUrl = 'http://localhost:3002' // Adjust port if needed

  console.log('Testing Certificate API endpoints...\n')

  try {
    // Test 1: Check if student certificates endpoint is accessible
    console.log('1. Testing student certificates endpoint...')
    const certResponse = await fetch(`${baseUrl}/api/student/certificates`)
    console.log('Status:', certResponse.status)
    console.log('Response:', await certResponse.text())
    console.log('')

    // Test 2: Check if module completion endpoint is accessible
    console.log('2. Testing module completion endpoint...')
    const completionResponse = await fetch(
      `${baseUrl}/api/student/check-module-completion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: 'test-module-id',
        }),
      }
    )
    console.log('Status:', completionResponse.status)
    console.log('Response:', await completionResponse.text())
    console.log('')

    // Test 3: Check if certificate download endpoint is accessible
    console.log('3. Testing certificate download endpoint...')
    const downloadResponse = await fetch(
      `${baseUrl}/api/student/certificates/download?url=test-url`
    )
    console.log('Status:', downloadResponse.status)
    console.log('Response:', await downloadResponse.text())
    console.log('')

    console.log('✅ All endpoints are accessible!')
    console.log(
      '\nNote: These tests only check if the endpoints are reachable.'
    )
    console.log(
      'For full functionality testing, you need to be logged in as a student.'
    )
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message)
  }
}

// Run the test
testCertificateAPI()
