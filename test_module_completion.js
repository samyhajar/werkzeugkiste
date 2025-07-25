const fetch = require('node-fetch')

async function testModuleCompletion() {
  try {
    const response = await fetch(
      'http://localhost:3000/api/student/check-module-completion',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: 'f1f3a0b7-fd90-4d1b-baad-2b4074601795', // Module 1
        }),
      }
    )

    const data = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error testing module completion:', error)
  }
}

testModuleCompletion()
