const http = require('http');

const registerData = JSON.stringify({
    firstName: "Test",
    lastName: "User",
    email: "test" + Date.now() + "@example.com",
    password: "password123",
    phoneNumber: "1234567890",
    role: "CUSTOMER"
});

// Register first
const req = http.request('http://localhost:8080/api/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerData)
    }
}, (res) => {
    res.on('data', () => { });
    res.on('end', () => {
        // Now login
        const loginData = JSON.stringify({
            email: JSON.parse(registerData).email,
            password: "password123"
        });
        const reqLogin = http.request('http://localhost:8080/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        }, (resLogin) => {
            let body = '';
            resLogin.on('data', d => body += d);
            resLogin.on('end', () => {
                const token = JSON.parse(body).token;
                if (!token) return console.log('Login failed', body);

                // Fetch shops
                http.get('http://localhost:8080/api/shops/nearby?lat=0&lng=0', {
                    headers: { 'Authorization': 'Bearer ' + token }
                }, (resShops) => {
                    let shopBody = '';
                    resShops.on('data', d => shopBody += d);
                    resShops.on('end', () => {
                        const shops = JSON.parse(shopBody);
                        if (!shops.length) {
                            console.log('No shops found');
                        } else {
                            shops.forEach(shop => {
                                http.get('http://localhost:8080/api/shops/' + shop.shopId + '/services', {
                                    headers: { 'Authorization': 'Bearer ' + token }
                                }, (resServ) => {
                                    let servBody = '';
                                    resServ.on('data', d => servBody += d);
                                    resServ.on('end', () => {
                                        if (resServ.statusCode !== 200) {
                                            console.log('ERROR for shop', shop.shopId, shop.name, 'Status:', resServ.statusCode);
                                            console.log(servBody);
                                        } else {
                                            console.log('OK for shop', shop.shopId, shop.name);
                                        }
                                    });
                                });
                            });
                        }

                        // ALSO test upload!
                        const uploadData = JSON.stringify({
                            name: "Test Upload Error Shop",
                            address: "Test Address",
                            latitude: 10.0,
                            longitude: 10.0,
                            showcaseImages: [],
                            services: [
                                { name: "Test Service", price: "10", category: "HAIRCUT" }
                            ]
                        });
                        const reqUpload = http.request('http://localhost:8080/api/shops', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token,
                                'Content-Length': Buffer.byteLength(uploadData)
                            }
                        }, (resUp) => {
                            let upBody = '';
                            resUp.on('data', d => upBody += d);
                            resUp.on('end', () => {
                                console.log('Upload Status:', resUp.statusCode);
                                if (resUp.statusCode !== 200) console.log('Upload Error:', upBody);
                            });
                        });
                        reqUpload.write(uploadData);
                        reqUpload.end();
                    });
                });
            });
        });
        reqLogin.write(loginData);
        reqLogin.end();
    });
});
req.write(registerData);
req.end();
