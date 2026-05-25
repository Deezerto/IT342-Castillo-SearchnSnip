const http = require('http');

const data = JSON.stringify({
    email: "test@example.com",
    password: "password123"
});

const req = http.request('http://localhost:8080/api/users/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            const token = JSON.parse(body).token;
            if (!token) { console.log('Login failed', body); return; }
            
            // Now upload
            const uploadData = JSON.stringify({
                name: "Test Shop",
                address: "Test Address",
                latitude: 10.0,
                longitude: 10.0,
                showcaseImages: [],
                services: [
                    { name: "Test Service", price: "10", category: "HAIRCUT" }
                ]
            });
            
            const req2 = http.request('http://localhost:8080/api/shops', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'Content-Length': Buffer.byteLength(uploadData)
                }
            }, (res2) => {
                let body2 = '';
                res2.on('data', d => body2 += d);
                res2.on('end', () => {
                    console.log('Upload Status:', res2.statusCode);
                    console.log('Upload Response:', body2);
                });
            });
            req2.write(uploadData);
            req2.end();
            
        } catch(e) {
            console.log('Error parsing login response', e);
        }
    });
});

req.write(data);
req.end();
