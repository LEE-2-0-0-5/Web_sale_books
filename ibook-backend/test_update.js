const userId = 'ND284059';
const url = `http://localhost:3001/api/user/${userId}`;

const payload = {
    name: 'Test User',
    phone: '0123456789',
    address: 'Test Address',
    gender: 'Nam',
    dob: '2000-01-01',
    avatar: '',
    email: 'test@example.com'
};

console.log('Testing GET request first...');
fetch(url)
    .then(async response => {
        console.log('GET Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('GET Response:', data);

            console.log('Now testing PUT request...');
            return fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } else {
            console.log('GET failed');
            throw new Error('GET failed');
        }
    })
    .then(async response => {
        if (response) {
            console.log('PUT Status:', response.status);
            const text = await response.text();
            console.log('PUT Response Body:', text);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
