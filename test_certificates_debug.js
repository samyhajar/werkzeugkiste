// Debug script to test certificates functionality
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

async function testCertificatesAPI() {
  const baseUrl = 'http://localhost:3000'

  console.log('Testing Certificates API...\n')

  try {
    // Test 1: Check if the API endpoint is accessible
    console.log('1. Testing certificates endpoint...')
    const response = await fetch(`${baseUrl}/api/student/certificates`)
    console.log('Status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('Response:', JSON.stringify(data, null, 2))
    } else {
      const errorText = await response.text()
      console.log('Error response:', errorText)
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Also test the admin certificates endpoint
async function testAdminCertificatesAPI() {
  const baseUrl = 'http://localhost:3000'

  console.log('\nTesting Admin Certificates API...\n')

  try {
    const response = await fetch(`${baseUrl}/api/admin/certificates`)
    console.log('Admin Status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('Admin Response:', JSON.stringify(data, null, 2))
    } else {
      const errorText = await response.text()
      console.log('Admin Error response:', errorText)
    }
  } catch (error) {
    console.error('Admin Error:', error.message)
  }
}

// Run tests
testCertificatesAPI()
  .then(() => {
    return testAdminCertificatesAPI()
  })
  .catch(console.error)
