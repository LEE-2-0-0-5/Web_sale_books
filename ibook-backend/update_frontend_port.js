const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/Home.jsx',
    'src/pages/ProductDetail.jsx',
    'src/pages/Register.jsx',
    'src/pages/Login.jsx',
    'src/pages/Checkout.jsx',
    'src/pages/Account.jsx',
    'src/components/Header.jsx',
    'src/admin/OrderManager.jsx'
];

const backendDir = 'c:/Users/Khanh/OneDrive/Máy tính/Công nghệ thông tin Thăng Long/Công Nghệ Phần Mềm/ibook-app';

files.forEach(file => {
    const filePath = path.join(backendDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Replace localhost:3000 or IP:3000
        const newContent = content.replace(/:3000/g, ':3001');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${file}`);
        } else {
            console.log(`No change in ${file}`);
        }
    } else {
        console.error(`File not found: ${filePath}`);
    }
});
