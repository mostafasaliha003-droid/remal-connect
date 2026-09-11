require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const axios = require('axios'); 
const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs'); 
const multer = require('multer'); 
const nodemailer = require('nodemailer'); 
const path = require('path');

const app = express();

// ==========================================
// طباعة الـ IP الخارجي للتأكيد
// ==========================================
axios.get('https://api.ipify.org?format=json')
  .then(response => {
    console.log(`🚀 PUBLIC IP ADDRESS: ${response.data.ip}`);
  })
  .catch(() => console.log('تعذر جلب الـ IP'));

// ==========================================
// إعدادات الحماية والوصول
// ==========================================
app.use(express.json());
app.use(cors()); 
app.use(express.static(__dirname));

// ==========================================
// الاتصال بقاعدة بيانات MongoDB
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ متصل بقاعدة بيانات MongoDB بنجاح'))
  .catch((err) => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

const upload = multer({ storage: multer.memoryStorage() });

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// ==========================================
// النماذج (Schemas & Models)
// ==========================================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    whatsapp: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'agent', 'cs', 'admin'], default: 'customer' },
    walletBalance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const transactionSchema = new mongoose.Schema({
    referenceId: { type: String, unique: true },
    customerEmail: { type: String },
    type: { type: String, enum: ['b2c', 'b2b', 'topup'] },
    packageId: { type: String },
    iccid: { type: String }, 
    apiCost: { type: Number, required: true }, 
    sellingPrice: { type: Number, required: true }, 
    netMargin: { type: Number }, 
    whatsappDelivered: { type: Boolean, default: false },
    status: { type: String, enum: ['pending_payment', 'success', 'failed', 'refunded'], default: 'pending_payment' }
}, { timestamps: true });

transactionSchema.pre('save', function(next) {
    if(this.sellingPrice && this.apiCost) { this.netMargin = this.sellingPrice - this.apiCost; }
    next();
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// ==========================================
// مسارات الحسابات
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, whatsapp, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'البريد مسجل مسبقاً' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ fullName, email, whatsapp, password: hashedPassword, role: 'customer' });
        await newUser.save();
        res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ داخلي' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'بيانات الدخول غير صحيحة' });

        res.status(200).json({ 
            success: true, 
            user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, walletBalance: user.walletBalance }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ داخلي' });
    }
});

// ==========================================
// تكامل Airalo الموحد
// ==========================================
let airaloAccessToken = null;
let tokenExpirationTime = null;

async function getAiraloToken() {
    if (airaloAccessToken && tokenExpirationTime && Date.now() < (tokenExpirationTime - 300000)) {
        return airaloAccessToken;
    }
    
    const response = await axios.post('https://partners-api.airalo.com/v2/token', {
        client_id: process.env.AIRALO_CLIENT_ID,
        client_secret: process.env.AIRALO_CLIENT_SECRET,
        grant_type: 'client_credentials'
    }, { 
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        } 
    });

    airaloAccessToken = response.data?.data?.access_token || response.data?.access_token;
    const expiresIn = response.data?.data?.expires_in || response.data?.expires_in || 3600;
    tokenExpirationTime = Date.now() + (expiresIn * 1000); 

    return airaloAccessToken;
}

// جلب وتنسيق الباقات لتتوافق مع واجهة العرض
app.get('/api/airalo/packages', async (req, res) => {
    let formattedPackages = [];
    try {
        const token = await getAiraloToken();
        const response = await axios.get('https://partners-api.airalo.com/v2/packages', {
            headers: { 
                'Accept': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            params: { 'limit': 50 }
        });
        
        const rawData = response.data?.data || [];

        rawData.forEach(item => {
            // معالجة الرد في حال كانت الباقات متداخلة داخل مصفوفة الدولة
            if (item.packages && Array.isArray(item.packages)) {
                item.packages.forEach(subPkg => {
                    const usd = subPkg.price || subPkg.net_price || 5;
                    const aed = (usd * 3.67).toFixed(2);
                    formattedPackages.push({
                        id: subPkg.id,
                        country: item.title || 'السعودية',
                        country_code: item.country_code || 'SA',
                        data: subPkg.data || (subPkg.amount ? `${Math.round(subPkg.amount / 1024)} GB` : 'غير محدد'),
                        validity: subPkg.validity || (subPkg.day ? `${subPkg.day} أيام` : 'غير محدد'),
                        price: aed,
                        type: subPkg.type || 'local'
                    });
                });
            } else {
                // معالجة الرد في حال كانت الباقات مصفوفة مباشرة
                const usd = item.price || item.net_price || 5;
                const aed = (usd * 3.67).toFixed(2);
                formattedPackages.push({
                    id: item.id || item.package_id,
                    country: item.country || 'السعودية',
                    country_code: item.country_code || 'SA',
                    data: item.data || (item.amount ? `${Math.round(item.amount / 1024)} GB` : 'غير محدد'),
                    validity: item.validity || (item.day ? `${item.day} أيام` : 'غير محدد'),
                    price: aed,
                    type: item.type || 'local'
                });
            }
        });

    } catch (error) {
        console.log('⚠️ خطأ في جلب باقات Airalo:', error.response?.status, error.response?.data || error.message);
    }

    if (formattedPackages.length === 0) {
        formattedPackages = [
            { id: "mock_1", country: "السعودية", country_code: "SA", data: "3 GB", validity: "7 أيام", price: "25.00", type: "local" },
            { id: "mock_2", country: "السعودية", country_code: "SA", data: "5 GB", validity: "15 يوماً", price: "40.00", type: "local" },
            { id: "mock_3", country: "السعودية", country_code: "SA", data: "10 GB", validity: "30 يوماً", price: "75.00", type: "local" },
            { id: "mock_global", country: "عالمية", country_code: "GLOBAL", data: "20 GB", validity: "365 يوماً", price: "150.00", type: "global", isHot: true }
        ];
    }

    res.json({ success: true, count: formattedPackages.length, packages: formattedPackages });
});

// ==========================================
// مسارات الدفع (Ziina) وتسليم الشريحة
// ==========================================
app.post('/api/checkout', async (req, res) => {
    let { packageId, price, customerEmail } = req.body;
    
    // تأمين تحويل السعر إلى رقم ومنع أخطاء Mongoose
    price = parseFloat(price);
    if (isNaN(price) || price <= 0) {
        price = 35.00;
    }

    try {
        const newTx = new Transaction({
            referenceId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            customerEmail: customerEmail || 'guest@remaltourismllc.com', 
            type: 'b2c', 
            packageId,
            sellingPrice: price, 
            apiCost: 0, 
            status: 'pending_payment'
        });
        await newTx.save();

        const ziinaPayload = {
            amount: Math.round(price * 100), 
            currency_code: 'AED',
            message: newTx.referenceId, 
            success_url: `https://remal-connect.onrender.com/index.html?payment=success&ref=${newTx.referenceId}`,
            cancel_url: `https://remal-connect.onrender.com/index.html?payment=failed`,
            test: false 
        };

        const ziinaResponse = await axios.post('https://api-v2.ziina.com/api/payment_intent', ziinaPayload, {
            headers: { 
                'Authorization': `Bearer ${process.env.ZIINA_API_KEY}`, 
                'Content-Type': 'application/json' 
            }
        });

        res.json({ success: true, paymentUrl: ziinaResponse.data.redirect_url, referenceId: newTx.referenceId });
    } catch (error) {
        console.error('Ziina Checkout Error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'فشل إنشاء جلسة الدفع' });
    }
});

app.post('/api/fulfill-esim', async (req, res) => {
    const { referenceId } = req.body;
    try {
        const tx = await Transaction.findOne({ referenceId });
        if (!tx) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
        if (tx.status === 'success') return res.json({ success: true, message: 'تم الإصدار مسبقاً' });

        tx.status = 'success';
        await tx.save();

        const token = await getAiraloToken();
        let airaloOrder = null;

        try {
            const orderResponse = await axios.post('https://partners-api.airalo.com/v2/orders', {
                package_id: tx.packageId,
                quantity: 1,
                type: 'transaction'
            }, {
                headers: { 
                    'Accept': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                }
            });
            
            airaloOrder = orderResponse.data?.data || orderResponse.data;
            tx.apiCost = airaloOrder.price || 0;
            await tx.save(); 

        } catch (airaloError) {
            console.log('⚠️ خطأ إصدار الشريحة من Airalo:', airaloError.response?.status, airaloError.response?.data || airaloError.message);
            return res.status(500).json({ success: false, message: 'فشل استخراج الشريحة من المزود' });
        }

        const simDetails = airaloOrder.sims ? airaloOrder.sims[0] : airaloOrder;
        res.json({
            success: true,
            iccid: simDetails.iccid,
            qr_code_url: simDetails.qrcode_url || simDetails.qr_code,
            lpa: simDetails.lpa
        });

    } catch (error) {
        console.error('Fulfill Error:', error);
        res.status(500).json({ success: false, message: 'فشل تسليم الشريحة' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Remal Connect API is running seamlessly on port ${PORT} 🚀`);
});
