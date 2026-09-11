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

// رابط المنصة الأساسي (الدومين المعتمد)
const APP_URL = process.env.APP_URL || 'https://remalsim.com';

// ==========================================
// طباعة الـ IP الخارجي للسيرفر (لإضافته في Airalo)
// ==========================================
axios.get('https://api.ipify.org?format=json')
  .then(response => {
    console.log(`🚀 PUBLIC IP ADDRESS: ${response.data.ip}`);
  })
  .catch(() => console.log('تعذر جلب الـ IP الخارجي'));

// ==========================================
// إعدادات الحماية والوصول (Middleware)
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
// النماذج المحدثة بنظام الأدرع والإحالة (Schemas & Models)
// ==========================================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    whatsapp: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'agent', 'cs', 'admin'], default: 'customer' },
    walletBalance: { type: Number, default: 0 }, // يبدأ بـ 0.00 AED
    purchasesCount: { type: Number, default: 0 }, // عدد المشتريات المكتملة
    referralCode: { type: String, unique: true, sparse: true }, // كود المشاركة الخاص
    referredBy: { type: String, default: null }, // كود من قام بدعوته
    hasCompletedFirstPurchase: { type: Boolean, default: false }, // لضمان صرف الـ 1 درهم لمرة واحدة فقط
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const transactionSchema = new mongoose.Schema({
    referenceId: { type: String, unique: true },
    customerEmail: { type: String },
    type: { type: String, enum: ['b2c', 'b2b', 'topup'], default: 'b2c' },
    packageId: { type: String },
    iccid: { type: String }, 
    apiCost: { type: Number, default: 0 }, 
    sellingPrice: { type: Number, required: true }, 
    walletDeducted: { type: Number, default: 0 }, // المبلغ المخصوم من المحفظة
    netMargin: { type: Number }, 
    whatsappDelivered: { type: Boolean, default: false },
    status: { type: String, enum: ['pending_payment', 'pending_fulfillment', 'success', 'failed', 'refunded'], default: 'pending_payment' }
}, { timestamps: true });

transactionSchema.pre('save', function(next) {
    if (this.sellingPrice !== undefined && this.apiCost !== undefined) { 
        this.netMargin = this.sellingPrice - this.apiCost; 
    }
    next();
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// ==========================================
// مسارات الحسابات
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, whatsapp, password, referredBy } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) return res.status(400).json({ success: false, message: 'البريد مسجل بالفعل' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // توليد كود إحالة فريد للحساب الجديد
        let generatedRefCode = 'RM' + Math.floor(100000 + Math.random() * 900000);
        let exists = await User.findOne({ referralCode: generatedRefCode });
        while (exists) {
            generatedRefCode = 'RM' + Math.floor(100000 + Math.random() * 900000);
            exists = await User.findOne({ referralCode: generatedRefCode });
        }

        const newUser = new User({ 
            fullName, 
            email: cleanEmail, 
            whatsapp, 
            password: hashedPassword, 
            role: 'customer',
            walletBalance: 0,
            purchasesCount: 0,
            referralCode: generatedRefCode,
            referredBy: referredBy ? referredBy.trim().toUpperCase() : null
        });
        await newUser.save();

        res.status(201).json({ 
            success: true, 
            message: 'تم إنشاء الحساب بنجاح',
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                walletBalance: newUser.walletBalance,
                purchasesCount: newUser.purchasesCount,
                referralCode: newUser.referralCode
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(400).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'بيانات الدخول غير صحيحة' });

        // التأكد من وجود كود إحالة دائم محفوظ في الحساب
        if (!user.referralCode) {
            user.referralCode = 'RM' + Math.floor(100000 + Math.random() * 900000);
            await user.save();
        }

        res.status(200).json({ 
            success: true, 
            user: { 
                id: user._id, 
                fullName: user.fullName, 
                email: user.email, 
                role: user.role, 
                walletBalance: user.walletBalance || 0,
                purchasesCount: user.purchasesCount || 0,
                referralCode: user.referralCode
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
});

// استعلام بيانات المستخدم وتحديث الرصيد
app.get('/api/user/profile', async (req, res) => {
    try {
        const email = req.query.email ? req.query.email.trim().toLowerCase() : null;
        if (!email) return res.status(400).json({ success: false, message: 'البريد مطلوب' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        if (!user.referralCode) {
            user.referralCode = 'RM' + Math.floor(100000 + Math.random() * 900000);
            await user.save();
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                walletBalance: user.walletBalance || 0,
                purchasesCount: user.purchasesCount || 0,
                referralCode: user.referralCode
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'خطأ داخلي' });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'يرجى إدخال البريد الإلكتروني' });

        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(404).json({ success: false, message: 'البريد الإلكتروني غير مسجل لدينا' });

        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(tempPassword, salt);
        await user.save();

        const mailOptions = {
            from: `"Remal Connect" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'استعادة كلمة المرور - Remal Connect',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 25px; background: #0f172a; color: #f8fafc; border-radius: 10px; max-width: 500px; margin: auto;">
                    <h2 style="color: #38bdf8; text-align: center;">Remal Connect</h2>
                    <p>مرحباً <strong>${user.fullName}</strong>،</p>
                    <p>كلمة المرور المؤقتة الجديدة الخاصة بك هي:</p>
                    <div style="background: #1e293b; padding: 14px; text-align: center; border-radius: 8px; font-size: 20px; font-weight: bold; color: #38bdf8; letter-spacing: 2px; border: 1px dashed #38bdf8; margin: 15px 0;">
                        ${tempPassword}
                    </div>
                    <p style="font-size: 13px; color: #94a3b8;">يمكنك استخدام كلمة المرور هذه لتسجيل الدخول فوراً وتغييرها من حسابك.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'تم إرسال كلمة المرور المؤقتة إلى بريدك بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'تعذر إرسال البريد الإلكتروني، يرجى المحاولة لاحقاً' });
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

app.get('/api/airalo/packages', async (req, res) => {
    let formattedPackages = [];
    try {
        const token = await getAiraloToken();
        const apiParams = { limit: 50 };
        if (req.query.country) {
            apiParams['filter[country]'] = req.query.country;
        }

        const response = await axios.get('https://partners-api.airalo.com/v2/packages', {
            headers: { 
                'Accept': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            params: apiParams
        });
        
        const rawCountries = response.data?.data || [];

        rawCountries.forEach(country => {
            const countryTitle = country.title || 'السعودية';
            const countryCode = country.country_code || 'SA';

            if (country.operators && Array.isArray(country.operators)) {
                country.operators.forEach(operator => {
                    if (operator.packages && Array.isArray(operator.packages)) {
                        operator.packages.forEach(pkg => {
                            const usdPrice = pkg.price || pkg.net_price || pkg.prices?.recommended_retail_price?.USD || 5;
                            const aedPrice = (usdPrice * 3.67).toFixed(2);

                            formattedPackages.push({
                                id: pkg.id,
                                package_id: pkg.id,
                                country: countryTitle,
                                country_code: countryCode,
                                operator: operator.title,
                                data: pkg.data || (pkg.amount ? `${Math.round(pkg.amount / 1024)} GB` : 'غير محدد'),
                                validity: pkg.day ? `${pkg.day} أيام` : '7 أيام',
                                price: aedPrice,
                                sellingPrice: aedPrice,
                                type: operator.type || 'local'
                            });
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.log('⚠️ تنبيه في استخراج باقات Airalo:', error.response?.status, error.response?.data || error.message);
    }

    if (formattedPackages.length === 0) {
        formattedPackages = [
            { id: "mock_1", package_id: "mock_1", country: "السعودية", country_code: "SA", data: "3 GB", validity: "7 أيام", price: "25.00", sellingPrice: "25.00", type: "local" },
            { id: "mock_2", package_id: "mock_2", country: "السعودية", country_code: "SA", data: "5 GB", validity: "15 يوماً", price: "40.00", sellingPrice: "40.00", type: "local" },
            { id: "mock_3", package_id: "mock_3", country: "السعودية", country_code: "SA", data: "10 GB", validity: "30 يوماً", price: "75.00", sellingPrice: "75.00", type: "local" }
        ];
    }

    res.json({ success: true, count: formattedPackages.length, packages: formattedPackages });
});

// ==========================================
// مسار الدفع المحسن (دعم خصم المحفظة + Ziina)
// ==========================================
app.post('/api/checkout', async (req, res) => {
    let { packageId, price, customerEmail, walletDeducted } = req.body;
    
    price = parseFloat(price);
    walletDeducted = parseFloat(walletDeducted) || 0;
    const cleanEmail = customerEmail ? customerEmail.trim().toLowerCase() : 'guest@remalsim.com';

    // 1. الدفع بالكامل من رصيد المحفظة (السعر المطلوب 0)
    if (price === 0 && walletDeducted > 0) {
        try {
            const user = await User.findOne({ email: cleanEmail });
            if (!user || (user.walletBalance || 0) < walletDeducted) {
                return res.status(400).json({ success: false, message: 'رصيد المحفظة غير كافٍ لإتمام الطلب' });
            }

            user.walletBalance = Math.max(0, user.walletBalance - walletDeducted);
            await user.save();

            const referenceId = `WAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newTx = new Transaction({
                referenceId,
                customerEmail: cleanEmail,
                packageId: packageId || 'package_default',
                sellingPrice: 0,
                walletDeducted: walletDeducted,
                apiCost: 0,
                status: 'pending_fulfillment'
            });
            await newTx.save();

            return res.json({ 
                success: true, 
                walletPaid: true, 
                referenceId,
                message: 'تم خصم المبلغ من المحفظة بنجاح' 
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'تعذر الدفع عبر المحفظة' });
        }
    }

    // 2. الدفع البنكي عبر Ziina
    if (isNaN(price) || price <= 0) {
        price = 35.00;
    }

    try {
        const referenceId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newTx = new Transaction({
            referenceId,
            customerEmail: cleanEmail,
            packageId: packageId || 'package_default',
            sellingPrice: price,
            walletDeducted: walletDeducted,
            apiCost: 0,
            status: 'pending_payment'
        });
        await newTx.save();

        const amountInFils = Math.round(price * 100);

        const ziinaPayload = {
            amount: amountInFils,
            currency_code: 'AED',
            message: referenceId,
            success_url: `${APP_URL}/index.html?payment=success&ref=${referenceId}`,
            cancel_url: `${APP_URL}/index.html?payment=failed`,
            failure_url: `${APP_URL}/index.html?payment=failed`,
            test: false
        };

        const ziinaResponse = await axios.post('https://api-v2.ziina.com/api/payment_intent', ziinaPayload, {
            headers: { 
                'Authorization': `Bearer ${process.env.ZIINA_API_KEY}`, 
                'Content-Type': 'application/json' 
            }
        });

        res.json({ success: true, paymentUrl: ziinaResponse.data.redirect_url, referenceId });
    } catch (error) {
        console.error('Ziina Checkout Error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'فشل إنشاء جلسة الدفع' });
    }
});

// ==========================================
// مسار تسليم الشريحة + الكاش باك + مكافأة الإحالة (1 AED)
// ==========================================
app.post('/api/fulfill-esim', async (req, res) => {
    const { referenceId, packageId, customerEmail } = req.body;
    try {
        let tx = await Transaction.findOne({ referenceId });
        
        // مرونة مع طلبات المحفظة المباشرة
        if (!tx) {
            if (referenceId && referenceId.startsWith('WAL-')) {
                tx = new Transaction({
                    referenceId,
                    customerEmail: customerEmail || 'guest@remalsim.com',
                    packageId: packageId || 'package_default',
                    sellingPrice: 0,
                    status: 'pending_fulfillment'
                });
                await tx.save();
            } else {
                return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
            }
        }

        if (tx.status === 'success') return res.json({ success: true, message: 'تم الإصدار مسبقاً' });

        // خصم المحفظة الجزئي إن وُجد
        if (tx.walletDeducted > 0 && !referenceId.startsWith('WAL-')) {
            const buyer = await User.findOne({ email: tx.customerEmail });
            if (buyer && buyer.walletBalance >= tx.walletDeducted) {
                buyer.walletBalance = Math.max(0, buyer.walletBalance - tx.walletDeducted);
                await buyer.save();
            }
        }

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
            tx.status = 'success';
            await tx.save(); 

        } catch (airaloError) {
            console.log('⚠️ خطأ إصدار الشريحة من Airalo:', airaloError.response?.status, airaloError.response?.data || airaloError.message);
            
            // معالجة مرنة لطلبات شحن الرصيد التجريبية
            if (tx.packageId && tx.packageId.startsWith('topup_')) {
                airaloOrder = { sims: [{ iccid: tx.packageId.split('_')[1] || '890000000', qrcode_url: '', lpa: '' }] };
                tx.status = 'success';
                await tx.save();
            } else {
                return res.status(500).json({ success: false, message: 'فشل استخراج الشريحة من المزود' });
            }
        }

        // ==========================================
        // 💰 احتساب الأدرع الأربعة والكاش باك ومكافأة الإحالة
        // ==========================================
        let earnedCashback = 0;
        const buyer = await User.findOne({ email: tx.customerEmail });

        if (buyer) {
            const currentPurchases = buyer.purchasesCount || 0;

            // تحديد نسبة الكاش باك حسب شروطك المحددة:
            // 0 - 4 طلبات: الدرع الفضي (1%)
            // 5 - 10 طلبات: الدرع الذهبي (1.5%)
            // 11 - 20 طلباً: الدرع البلاتيني (2%)
            // 21 - 50 طلباً: الدرع الماسي VIP (3%)
            let cashbackRate = 0.01;
            if (currentPurchases > 20) cashbackRate = 0.03;
            else if (currentPurchases > 10) cashbackRate = 0.02;
            else if (currentPurchases > 4) cashbackRate = 0.015;

            earnedCashback = parseFloat((tx.sellingPrice * cashbackRate).toFixed(2));
            buyer.walletBalance = parseFloat(((buyer.walletBalance || 0) + earnedCashback).toFixed(2));
            buyer.purchasesCount = currentPurchases + 1;

            // 🎁 مكافأة الإحالة الحقيقية: 1 درهم للمُحيل عند أول شراء ناجح لصديقه فقط
            if (!buyer.hasCompletedFirstPurchase) {
                buyer.hasCompletedFirstPurchase = true;

                if (buyer.referredBy) {
                    const referrer = await User.findOne({ referralCode: buyer.referredBy });
                    if (referrer) {
                        referrer.walletBalance = parseFloat(((referrer.walletBalance || 0) + 1.00).toFixed(2));
                        await referrer.save();
                        console.log(`🎁 تم منح 1 درهم للمُحيل (${referrer.email}) لاشتراك صديقه (${buyer.email}) لأول مرة!`);
                    }
                }
            }

            await buyer.save();
        }

        const simDetails = airaloOrder.sims ? airaloOrder.sims[0] : airaloOrder;
        res.json({
            success: true,
            iccid: simDetails.iccid,
            qr_code_url: simDetails.qrcode_url || simDetails.qr_code,
            lpa: simDetails.lpa,
            earnedCashback,
            newWalletBalance: buyer ? buyer.walletBalance : 0,
            newPurchasesCount: buyer ? buyer.purchasesCount : 0
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
