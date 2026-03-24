const fetch = globalThis.fetch || require('node-fetch');

async function testRegister() {
    try {
        console.log('Testing Registration API...');
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'API Test User',
                username: `apitest_${Date.now()}`,
                email: `apitest_${Date.now()}@example.com`,
                password: 'password123',
            }),
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testRegister();
