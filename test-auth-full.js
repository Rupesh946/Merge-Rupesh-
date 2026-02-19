const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/auth';
const TIMESTAMP = Date.now();
const USER = {
    name: 'Full Test User',
    username: `fulltest_${TIMESTAMP}`,
    email: `fulltest_${TIMESTAMP}@example.com`,
    password: 'password123'
};

async function testAuthFlow() {
    try {
        console.log('--- Starting Auth Flow Test ---');

        // 1. Register
        console.log('\n1. Testing Registration...');
        const registerRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER)
        });

        const registerData = await registerRes.json();
        console.log(`Status: ${registerRes.status}`);

        if (!registerRes.ok) {
            console.error('Registration Failed:', registerData);
            return;
        }
        console.log('Registration Success!');

        // 2. Login
        console.log('\n2. Testing Login...');
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: USER.email,
                password: USER.password
            })
        });

        const loginData = await loginRes.json();
        console.log(`Status: ${loginRes.status}`);

        if (!loginRes.ok) {
            console.error('Login Failed:', loginData);
            return;
        }
        console.log('Login Success!');

        const token = loginData.token;
        if (!token) {
            console.error('No token received!');
            return;
        }
        console.log('Token received.');

        // 3. Me
        console.log('\n3. Testing /me Endpoint...');
        const meRes = await fetch(`${BASE_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const meData = await meRes.json();
        console.log(`Status: ${meRes.status}`);

        if (!meRes.ok) {
            console.error('Me Endpoint Failed:', meData);
            return;
        }
        console.log('Me Endpoint Success:', meData);
        console.log('\n--- Auth Flow Test Completed Successfully ---');

    } catch (error) {
        console.error('Test Error:', error);
    }
}

testAuthFlow();
