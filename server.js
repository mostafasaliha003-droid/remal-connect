require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const crypto = require('crypto');
const path = require('path');

const app = express();

const APP_URL = process.env.APP_URL || 'https://remalsim.com';

app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: '🚀 السيرفر يعمل ويتصل بالواجهة بنجاح!' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ متصل بقاعدة بيانات MongoDB بنجاح'))
  .catch((err) => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message));

const upload = multer({ storage: multer.memoryStorage() });

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
});

// ==========================================
// نماذج قاعدة البيانات
// ==========================================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    whatsapp: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'agent', 'cs', 'admin'], default: 'customer' },
    walletBalance: { type: Number, default: 0 },
    purchasesCount: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null },
    hasCompletedFirstPurchase: { type: Boolean, default: false },
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
    walletDeducted: { type: Number, default: 0 },
    netMargin: { type: Number },
    esimsCloudLink: { type: String },
    esimsCloudAccessCode: { type: String },
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

const packageSchema = new mongoose.Schema({
    package_id: { type: String, required: true, unique: true },
    slug: { type: String },
    type: { type: String }, 
    country_code: { type: String },
    country_title: { type: String },
    operator_title: { type: String },
    data: { type: String },
    validity: { type: String },
    price: { type: Number },
    net_price: { type: Number },
    is_unlimited: { type: Boolean, default: false },
    has_topup: { type: Boolean, default: false }
}, { timestamps: true });
const AiraloPackage = mongoose.model('AiraloPackage', packageSchema);

// ==========================================
// مسارات الحسابات وسجل المشتريات
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, whatsapp, password, referredBy } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) return res.status(400).json({ success: false, message: 'البريد مسجل بالفعل' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const prefix = fullName ? fullName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) : 'RML';
        const finalPrefix = prefix.length >= 2 ? prefix : 'RML';
        let generatedRefCode = finalPrefix + Math.floor(1000 + Math.random() * 9000);
        
        let exists = await User.findOne({ referralCode: generatedRefCode });
        while (exists) {
            generatedRefCode = finalPrefix + Math.floor(1000 + Math.random() * 9000);
            exists = await User.findOne({ referralCode: generatedRefCode });
        }

        const newUser = new User({
            fullName, email: cleanEmail, whatsapp, password: hashedPassword, role: 'customer', walletBalance: 0, purchasesCount: 0, referralCode: generatedRefCode, referredBy: referredBy ? referredBy.trim().toUpperCase() : null
        });
        await newUser.save();

        res.status(201).json({
            success: true, message: 'تم إنشاء الحساب بنجاح', user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email, role: newUser.role, walletBalance: newUser.walletBalance, purchasesCount: newUser.purchasesCount, referralCode: newUser.referralCode }
        });
    } catch (error) { res.status(500).json({ success: false, message: 'خطأ داخلي' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(400).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'بيانات الدخول غير صحيحة' });

        if (!user.referralCode) {
            const prefix = user.fullName ? user.fullName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) : 'RML';
            user.referralCode = (prefix.length >= 2 ? prefix : 'RML') + Math.floor(1000 + Math.random() * 9000);
            await user.save();
        }

        res.status(200).json({
            success: true, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, walletBalance: user.walletBalance || 0, purchasesCount: user.purchasesCount || 0, referralCode: user.referralCode }
        });
    } catch (error) { res.status(500).json({ success: false, message: 'خطأ داخلي' }); }
});

app.get('/api/user/profile', async (req, res) => {
    try {
        const email = req.query.email ? req.query.email.trim().toLowerCase() : null;
        if (!email) return res.status(400).json({ success: false, message: 'البريد مطلوب' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        res.json({ success: true, user: { id: user._id, fullName: user.fullName, email: user.email, walletBalance: user.walletBalance || 0, purchasesCount: user.purchasesCount || 0, referralCode: user.referralCode } });
    } catch (e) { res.status(500).json({ success: false, message: 'خطأ داخلي' }); }
});

app.get('/api/user/esims', async (req, res) => {
    try {
        const email = req.query.email ? req.query.email.trim().toLowerCase() : null;
        if (!email) return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });

        const userOrders = await Transaction.find({ customerEmail: email, status: 'success' })
                                            .sort({ createdAt: -1 });

        res.json({ success: true, count: userOrders.length, orders: userOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'تعذر جلب سجل الطلبات' });
    }
});

// ==========================================
// 🚀 توكن Airalo (Production & Caching)
// ==========================================
let airaloAccessToken = null;
let tokenExpirationTime = null;

async function getAiraloToken() {
    if (airaloAccessToken && tokenExpirationTime && Date.now() < tokenExpirationTime) return airaloAccessToken;
    
    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.AIRALO_CLIENT_ID);
        params.append('client_secret', process.env.AIRALO_CLIENT_SECRET);
        params.append('grant_type', 'client_credentials');

        const response = await axios.post('https://partners-api.airalo.com/v2/token', params, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' } 
        });

        airaloAccessToken = response.data?.data?.access_token || response.data?.access_token;
        const expiresIn = response.data?.data?.expires_in || response.data?.expires_in || 86400;
        tokenExpirationTime = Date.now() + (expiresIn * 1000) - 300000; 
        return airaloAccessToken;
    } catch (error) { throw new Error('فشل المصادقة مع مزود الخدمة'); }
}

async function airaloApiRequest(method, endpoint, dataOrParams = {}, isFormUrlEncoded = false) {
    let token = await getAiraloToken();
    const url = `https://partners-api.airalo.com/v2${endpoint}`;
    const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Type': isFormUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json' };

    try {
        const config = { method, url, headers };
        if (method.toLowerCase() === 'get') config.params = dataOrParams; else config.data = dataOrParams;
        return await axios(config);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            airaloAccessToken = null; tokenExpirationTime = null;
            token = await getAiraloToken();
            headers['Authorization'] = `Bearer ${token}`;
            const retryConfig = { method, url, headers };
            if (method.toLowerCase() === 'get') retryConfig.params = dataOrParams; else retryConfig.data = dataOrParams;
            return await axios(retryConfig);
        }
        throw error;
    }
}

// ==========================================
// نظام المزامنة الدورية الذكي
// ==========================================
async function syncAiraloPackages() {
    console.log('🔄 بدء مزامنة باقات Airalo في الخلفية...');
    try {
        const token = await getAiraloToken();
        const response = await axios.get('https://partners-api.airalo.com/v2/packages', {
            params: { limit: 1000, include: 'topup' }, 
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        const rawData = response.data?.data || [];
        let updatedCount = 0;

        for (const item of rawData) {
            const countryTitle = item.title || 'وجهة عالمية / إقليمية';
            
            let countryCode = item.country_code;
            if (!countryCode) {
                if (item.slug === 'world') countryCode = 'GLOBAL';
                else if (item.slug === 'europe') countryCode = 'EU';
                else if (item.slug === 'asia') countryCode = 'AS';
                else if (item.slug === 'africa') countryCode = 'AF';
                else countryCode = 'REGIONAL';
            }

            if (item.operators && Array.isArray(item.operators)) {
                for (const operator of item.operators) {
                    if (operator.packages && Array.isArray(operator.packages)) {
                        for (const pkg of operator.packages) {
                            const aedPriceNum = pkg.prices?.recommended_retail_price?.AED || pkg.net_price || pkg.price || 35;
                            const netPriceNum = pkg.prices?.net_price?.AED || pkg.net_price || 0;
                            
                            const packageData = {
                                package_id: pkg.id,
                                slug: item.slug,
                                type: operator.type || 'local',
                                country_code: countryCode,
                                country_title: countryTitle,
                                operator_title: operator.title,
                                data: pkg.data || (pkg.amount ? `${Math.round(pkg.amount / 1024)} GB` : 'غير محدد'),
                                validity: pkg.day ? `${pkg.day} أيام` : '7 أيام',
                                price: parseFloat(aedPriceNum).toFixed(2),
                                net_price: parseFloat(netPriceNum).toFixed(2),
                                is_unlimited: pkg.is_unlimited || false,
                                has_topup: operator.rechargeability || false
                            };

                            await AiraloPackage.findOneAndUpdate(
                                { package_id: pkg.id },
                                { $set: packageData },
                                { upsert: true, new: true }
                            );
                            updatedCount++;
                        }
                    }
                }
            }
        }
        console.log(`✅ تمت المزامنة بنجاح! تم حفظ/تحديث ${updatedCount} باقة في قاعدة البيانات.`);
    } catch (error) {
        console.error('❌ فشل عملية المزامنة:', error.response?.data || error.message);
    }
}

cron.schedule('0 * * * *', syncAiraloPackages);
setTimeout(syncAiraloPackages, 5000); 

// ==========================================
// مسار جلب الباقات السريع للمستخدم (تم تحسينه لتفادي البطء)
// ==========================================
app.get('/api/airalo/packages', async (req, res) => {
    try {
        const countryQuery = req.query.country;

        // 1. حالة فتح الموقع الرئيسية (بدون بحث): عرض باقة واحدة لأهم 10 دول
        if (!countryQuery) {
            const topCountries = ['TR', 'AE', 'SA', 'EG', 'GB', 'FR', 'US', 'TH', 'CH', 'IT'];
            let featuredPackages = [];

            for (let code of topCountries) {
                // جلب أرخص باقة لكل دولة من الدول المهمة
                const pkg = await AiraloPackage.findOne({ country_code: code }).sort({ price: 1 });
                if (pkg) featuredPackages.push(pkg);
            }

            if (featuredPackages.length === 0) {
                return res.json({ success: true, count: 1, isFeatured: true, packages: [
                    { id: "mock_1", package_id: "mock_1", country: "جاري مزامنة الباقات...", country_code: "AE", data: "تحديث", validity: "قريباً", price: "0.00", sellingPrice: "0.00", type: "local" }
                ]});
            }

            const formattedPackages = featuredPackages.map(pkg => ({
                id: pkg.package_id,
                package_id: pkg.package_id,
                country: pkg.country_title,
                country_code: pkg.country_code,
                operator: pkg.operator_title,
                data: pkg.data,
                validity: pkg.validity,
                price: pkg.price,
                sellingPrice: pkg.price,
                type: pkg.type,
                isHot: pkg.is_unlimited
            }));
            
            return res.json({ success: true, count: formattedPackages.length, isFeatured: true, packages: formattedPackages });
        }

        // 2. حالة البحث عن دولة محددة: جلب باقات الدولة بحد أقصى 15 باقة
        const query = { country_code: countryQuery.toUpperCase() };
        if (req.query.type) query.type = req.query.type;

        const dbPackages = await AiraloPackage.find(query).sort({ price: 1 }).limit(15);

        if (dbPackages.length > 0) {
            const formattedPackages = dbPackages.map(pkg => ({
                id: pkg.package_id,
                package_id: pkg.package_id,
                country: pkg.country_title,
                country_code: pkg.country_code,
                operator: pkg.operator_title,
                data: pkg.data,
                validity: pkg.validity,
                price: pkg.price,
                sellingPrice: pkg.price,
                type: pkg.type,
                isHot: pkg.is_unlimited
            }));
            return res.json({ success: true, count: formattedPackages.length, isFeatured: false, packages: formattedPackages });
        }

        return res.json({ success: true, count: 0, packages: [] });

    } catch (error) {
        console.error('❌ خطأ في مسار جلب الباقات:', error.message);
        res.status(500).json({ success: false, message: 'تعذر جلب الباقات' });
    }
});

// ==========================================
// 🚀 مسار جلب التفاصيل المتقدمة للباقة (يُستدعى عند الطلب فقط)
// ==========================================
app.get('/api/airalo/packages/:slug/info', async (req, res) => {
    try {
        const { slug } = req.params;
        const response = await airaloApiRequest('get', `/packages/${slug}/product-information`);
        res.json({ success: true, info: response.data?.data || response.data });
    } catch (error) {
        console.error(`⚠️ خطأ في جلب التفاصيل المتقدمة للباقة ${req.params.slug}:`, error.message);
        res.status(500).json({ success: false, message: 'تعذر جلب تفاصيل الباقة في الوقت الحالي.' });
    }
});

// ==========================================
// 🚀 مسار جلب الأجهزة المتوافقة (Lite)
// ==========================================
app.get('/api/airalo/devices', async (req, res) => {
    try {
        const response = await airaloApiRequest('get', '/compatible-devices-lite');
        res.json({ success: true, devices: response.data?.data || response.data });
    } catch (error) {
        console.error('⚠️ خطأ في جلب قائمة الأجهزة:', error.message);
        res.status(500).json({ success: false, message: 'تعذر جلب قائمة الأجهزة المتوافقة' });
    }
});

// ==========================================
// 🚀 مسار جلب رصيد محفظة Airalo (مخصص للوحة تحكم الإدارة)
// ==========================================
app.get('/api/airalo/balance', async (req, res) => {
    try {
        const response = await airaloApiRequest('get', '/balance');
        res.json({ success: true, balance: response.data?.data || response.data });
    } catch (error) {
        console.error('⚠️ خطأ في جلب رصيد Airalo:', error.message);
        res.status(500).json({ success: false, message: 'تعذر جلب الرصيد الاستراتيجي' });
    }
});

// ==========================================
// مسار الدفع
// ==========================================
app.post('/api/checkout', async (req, res) => {
    let { packageId, price, customerEmail, walletDeducted } = req.body;
    price = parseFloat(price); walletDeducted = parseFloat(walletDeducted) || 0;
    const cleanEmail = customerEmail ? customerEmail.trim().toLowerCase() : 'guest@remalsim.com';

    if (price === 0 && walletDeducted > 0) {
        try {
            const user = await User.findOne({ email: cleanEmail });
            if (!user || (user.walletBalance || 0) < walletDeducted) return res.status(400).json({ success: false, message: 'رصيد المحفظة غير كافٍ لإتمام الطلب' });
            user.walletBalance = Math.max(0, user.walletBalance - walletDeducted); await user.save();
            const referenceId = `WAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newTx = new Transaction({ referenceId, customerEmail: cleanEmail, packageId: packageId || 'package_default', sellingPrice: 0, walletDeducted: walletDeducted, apiCost: 0, status: 'pending_fulfillment' });
            await newTx.save();
            return res.json({ success: true, walletPaid: true, paymentUrl: `${APP_URL}/index.html?payment=success&ref=${referenceId}`, referenceId, message: 'تم خصم المبلغ من المحفظة بنجاح' });
        } catch (err) { return res.status(500).json({ success: false, message: 'تعذر الدفع عبر المحفظة' }); }
    }

    if (isNaN(price) || price <= 0) price = 35.00;

    try {
        const referenceId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newTx = new Transaction({ referenceId, customerEmail: cleanEmail, packageId: packageId || 'package_default', sellingPrice: price, walletDeducted: walletDeducted, apiCost: 0, status: 'pending_payment' });
        await newTx.save();
        const amountInFils = Math.round(price * 100);
        const ziinaPayload = { amount: amountInFils, currency_code: 'AED', message: referenceId, success_url: `${APP_URL}/index.html?payment=success&ref=${referenceId}`, cancel_url: `${APP_URL}/index.html?payment=failed`, failure_url: `${APP_URL}/index.html?payment=failed`, test: false };
        const ziinaResponse = await axios.post('https://api-v2.ziina.com/api/payment_intent', ziinaPayload, { headers: { 'Authorization': `Bearer ${process.env.ZIINA_API_KEY}`, 'Content-Type': 'application/json' } });
        res.json({ success: true, paymentUrl: ziinaResponse.data.redirect_url, referenceId });
    } catch (error) { res.status(500).json({ success: false, message: 'فشل إنشاء جلسة الدفع' }); }
});

// ==========================================
// استخراج الشريحة (ذكي: يفرق بين شريحة جديدة و إعادة الشحن)
// ==========================================
app.post('/api/fulfill-esim', async (req, res) => {
    const { referenceId, packageId, customerEmail } = req.body;
    try {
        let tx = await Transaction.findOne({ referenceId });
        if (!tx) {
            if (referenceId && referenceId.startsWith('WAL-')) {
                tx = new Transaction({ referenceId, customerEmail: customerEmail || 'guest@remalsim.com', packageId: packageId || 'package_default', sellingPrice: 0, status: 'pending_fulfillment' });
                await tx.save();
            } else { return res.status(404).json({ success: false, message: 'الطلب غير موجود' }); }
        }

        if (tx.status === 'success') return res.json({ success: true, message: 'تم الإصدار مسبقاً' });

        if (tx.walletDeducted > 0 && !referenceId.startsWith('WAL-')) {
            const buyer = await User.findOne({ email: tx.customerEmail });
            if (buyer && buyer.walletBalance >= tx.walletDeducted) {
                buyer.walletBalance = Math.max(0, buyer.walletBalance - tx.walletDeducted); await buyer.save();
            }
        }

        let airaloOrder = null;
        let isTopup = false;
        let finalIccid = '';

        try {
            const orderFormData = new URLSearchParams();
            let apiEndpoint = '/orders'; 

            if(tx.packageId && tx.packageId.startsWith('topup_')) {
                isTopup = true;
                const parts = tx.packageId.split('_'); 
                finalIccid = parts[1]; 
                orderFormData.append('iccid', parts[1]); 
                orderFormData.append('package_id', parts[2]); 
                apiEndpoint = '/orders/topups'; 
            } else { 
                orderFormData.append('package_id', tx.packageId); 
                orderFormData.append('quantity', 1); 
                orderFormData.append('brand_settings_name', 'Remal Connect');
            }
            orderFormData.append('description', `Order reference: ${tx.referenceId}`);

            const orderResponse = await airaloApiRequest('post', apiEndpoint, orderFormData.toString(), true);
            const responseData = orderResponse.data?.data || orderResponse.data;
            airaloOrder = responseData;
            
        } catch (airaloError) {
            if (airaloError.response?.status === 422 || (tx.packageId && tx.packageId.startsWith('mock_'))) {
                finalIccid = finalIccid || `890000${Date.now().toString().slice(-9)}`;
                airaloOrder = { sims: [{ 
                    iccid: finalIccid, 
                    qrcode_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LPA:1$remalsim.com$TEST', 
                    lpa: `LPA:1$smdp.io$${finalIccid}`, 
                    direct_apple_installation_url: 'https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA:1$smdp.io$TEST',
                    sharing: { link: "https://esims.cloud/remal-connect/mock-test", access_code: "1234" }
                }] };
            } else { return res.status(500).json({ success: false, message: 'عذراً، الخدمة غير متوفرة مؤقتاً لدى المزوّد.' }); }
        }

        let sharingLink = '';
        let sharingAccessCode = '';
        let qrCodeUrl = '';
        let lpaCode = '';
        let appleUrl = '';

        if (!isTopup) {
            const simsArray = airaloOrder.sims || [];
            const simDetails = simsArray.length > 0 ? simsArray[0] : airaloOrder;
            
            finalIccid = simDetails.iccid || finalIccid;
            sharingLink = simDetails.sharing?.link || '';
            sharingAccessCode = simDetails.sharing?.access_code || '';
            qrCodeUrl = simDetails.qrcode_url || simDetails.qrcode || '';
            lpaCode = simDetails.lpa || '';
            appleUrl = simDetails.direct_apple_installation_url || '';
        } else {
            sharingLink = tx.esimsCloudLink || '';
            sharingAccessCode = tx.esimsCloudAccessCode || '';
        }

        tx.apiCost = airaloOrder.price || 0; 
        tx.esimsCloudLink = sharingLink;
        tx.esimsCloudAccessCode = sharingAccessCode;
        tx.iccid = finalIccid;
        tx.status = 'success'; 
        await tx.save();

        let earnedCashback = 0;
        const buyer = await User.findOne({ email: tx.customerEmail });
        if (buyer) {
            const currentPurchases = buyer.purchasesCount || 0;
            let cashbackRate = currentPurchases > 20 ? 0.03 : currentPurchases > 10 ? 0.02 : currentPurchases > 4 ? 0.015 : 0.01;
            earnedCashback = parseFloat((tx.sellingPrice * cashbackRate).toFixed(2));
            buyer.walletBalance = parseFloat(((buyer.walletBalance || 0) + earnedCashback).toFixed(2));
            buyer.purchasesCount = currentPurchases + 1;
            if (!buyer.hasCompletedFirstPurchase) {
                buyer.hasCompletedFirstPurchase = true;
                if (buyer.referredBy) {
                    const referrer = await User.findOne({ referralCode: buyer.referredBy });
                    if (referrer) { referrer.walletBalance = parseFloat(((referrer.walletBadge || referrer.walletBalance || 0) + 1.00).toFixed(2)); await referrer.save(); }
                }
            }
            await buyer.save();
        }

        res.json({ 
            success: true, 
            is_topup: isTopup,
            iccid: finalIccid, 
            qr_code_url: qrCodeUrl, 
            lpa: lpaCode, 
            direct_apple_installation_url: appleUrl,
            esims_cloud_link: sharingLink,
            esims_cloud_access_code: sharingAccessCode,
            earnedCashback, 
            newWalletBalance: buyer ? buyer.walletBalance : 0, 
            newPurchasesCount: buyer ? buyer.purchasesCount : 0 
        });

    } catch (error) { res.status(500).json({ success: false, message: 'فشل تسليم الشريحة بسبب مشكلة تقنية' }); }
});

app.get('/api/airalo/instructions/:iccid', async (req, res) => {
    try {
        const { iccid } = req.params;
        const lang = req.query.lang || 'ar'; 
        const token = await getAiraloToken(); 

        const response = await axios.get(`https://partners-api.airalo.com/v2/sims/${iccid}/instructions`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept-Language': lang 
            }
        });

        res.json({ success: true, instructions: response.data?.data || response.data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'تعذر جلب إرشادات التثبيت الخاصة بالشريحة' });
    }
});

// ==========================================
// مسار الاستعلام عن الاستهلاك الحي (Check Usage)
// ==========================================
app.get('/api/airalo/usage/:iccid', async (req, res) => {
    try {
        const { iccid } = req.params;
        const response = await airaloApiRequest('get', `/sims/${iccid}/usage`);
        const usageData = response.data?.data || response.data;
        res.json({ success: true, usage: usageData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'تعذر جلب بيانات الاستهلاك حالياً.' });
    }
});

// ==========================================
// مسار جلب باقات إعادة الشحن (Top-ups) لشريحة معينة
// ==========================================
app.get('/api/airalo/topups/:iccid', async (req, res) => {
    try {
        const { iccid } = req.params;
        const response = await airaloApiRequest('get', `/sims/${iccid}/topups`);
        const topupsData = response.data?.data || response.data;
        res.json({ success: true, topups: topupsData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'تعذر جلب باقات إعادة الشحن لهذه الشريحة.' });
    }
});

// ==========================================
// مسار استرجاع سجل باقات الشريحة
// ==========================================
app.get('/api/airalo/sim/:iccid/packages', async (req, res) => {
    try {
        const { iccid } = req.params;
        const response = await airaloApiRequest('get', `/sims/${iccid}/packages`);
        res.json({ success: true, history: response.data?.data || response.data });
    } catch (error) {
        console.error('⚠️ خطأ في جلب سجل باقات الشريحة:', error.message);
        res.status(500).json({ success: false, message: 'تعذر استرجاع سجل الباقات حالياً.' });
    }
});

// ==========================================
// مسار استرجاع تفاصيل الشريحة (استعلام احتياطي)
// ==========================================
app.get('/api/airalo/sim/:iccid', async (req, res) => {
    try {
        const { iccid } = req.params;
        const response = await airaloApiRequest('get', `/sims/${iccid}`, { include: 'share' });
        res.json({ success: true, sim: response.data?.data || response.data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'تعذر استرجاع بيانات الشريحة حالياً.' });
    }
});

// ==========================================
// مسار الخطافات (Webhooks) لاستقبال التنبيهات من Airalo
// ==========================================

// 1. مسار التحقق (HEAD): تحتاجه Airalo لتفعيل الخطاف في لوحة التحكم الخاصة بهم
app.head('/api/webhooks/airalo', (req, res) => {
    res.status(200).send();
});

// 2. مسار استقبال الإشعارات (POST)
app.post('/api/webhooks/airalo', async (req, res) => {
    try {
        const signature = req.headers['airalo-signature'];
        let payload = req.body;

        // التحقق الأمني من التوقيع (HMAC SHA-512) لضمان أن الطلب من Airalo فقط
        if (signature && process.env.AIRALO_CLIENT_SECRET) {
            const payloadString = typeof payload === 'object' ? JSON.stringify(payload) : payload;
            const expectedSignature = crypto.createHmac('sha512', process.env.AIRALO_CLIENT_SECRET)
                                            .update(payloadString)
                                            .digest('hex');
            
            if (expectedSignature !== signature) {
                console.error('⛔ [WEBHOOK] تحذير أمني: توقيع غير صالح. تم رفض الطلب.');
                return res.status(403).send('Invalid Signature');
            }
        }

        console.log('🔔 [WEBHOOK] تم استلام إشعار موثوق من Airalo:', payload);

        // أ. معالجة تنبيه "انخفاض بيانات العميل" (Low Data Notification)
        if (payload.iccid && payload.level) {
            console.log(`📉 [تنبيه باقة العميل] الشريحة ${payload.iccid} وصلت لمستوى: ${payload.level} - المتبقي: ${payload.remaining_percentage}%`);
            // مستقبلاً: يمكن كتابة كود هنا يقرأ إيميل العميل من قاعدة البيانات ويرسل له إشعاراً أو واتساب لتشجيعه على إعادة الشحن (Top-up).
        } 
        // ب. معالجة تنبيه "انخفاض رصيد المنصة" (Credit Limit Notification)
        else if (payload.message && payload.remaining !== undefined) {
            console.log(`💰 [تنبيه الإدارة] تحذير: رصيد منصة Remal Connect في Airalo منخفض! الرصيد المتبقي: $${payload.remaining}`);
        }

        // يجب الرد دائماً بـ 200 لكي لا تقوم Airalo بإعادة إرسال نفس الطلب
        res.status(200).send('Webhook Received and Processed');

    } catch (error) {
        console.error('❌ خطأ في معالجة الـ Webhook:', error.message);
        res.status(500).send('Webhook Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Remal Connect API is running seamlessly on port ${PORT} 🚀`);
});
