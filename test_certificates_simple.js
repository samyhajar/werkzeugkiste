// Simple test for certificates API
const http = require('http')

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, res => {
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
        })
      })
    })

    req.on('error', err => {
      reject(err)
    })

    req.end()
  })
}

async function testCertificatesAPI() {
  try {
    console.log('Testing certificates API...')
    const result = await makeRequest(
      'http://localhost:3000/api/student/certificates'
    )
    console.log('Status:', result.status)
    console.log('Response:', result.data)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testCertificatesAPI()
