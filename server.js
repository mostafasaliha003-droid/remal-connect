require('dotenv').config(); // لإخفاء المفاتيح السرية
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // مكتبة للاتصال بـ API المورد
const mongoose = require('mongoose'); // مكتبة للاتصال بقاعدة البيانات
const bcrypt = require('bcryptjs'); // مكتبة التشفير

const app = express();

// ==========================================
// إعدادات الحماية والوصول (Middleware)
// ==========================================
app.use(express.json());
app.use(cors({
    origin: ['https://mostafasaliha003-droid.github.io'], // السماح لموقعك فقط
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// ==========================================
// الاتصال بقاعدة بيانات MongoDB
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ متصل بقاعدة بيانات MongoDB (Remal Connect) بنجاح'))
  .catch((err) => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// ==========================================
// هياكل قاعدة البيانات (Schemas & Models)
// ==========================================

// 1. هيكل المستخدمين والصلاحيات (Users)
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    whatsapp: { type: String },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['customer', 'agent', 'cs', 'admin'], // تحديد صلاحية الدخول
        default: 'customer' 
    },
    walletBalance: { type: Number, default: 0 }, // رصيد المحفظة للوكلاء والعملاء
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 2. هيكل وكلاء السفر والشركات (B2B Agencies)
const agencySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ربط الوكيل بحساب مستخدم
    companyName: { type: String, required: true },
    managerName: { type: String, required: true },
    financials: {
        accountName: String,
        bankName: String,
        iban: String,
        vatNumber: String
    },
    documents: {
        licenseUrl: String, 
        idUrl: String,
        vatUrl: String
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' // بانتظار الاعتماد من مركز القيادة
    },
    creditLimit: { type: Number, default: 0 }, // السقف الائتماني المسموح به
    totalIssuedEsims: { type: Number, default: 0 }
}, { timestamps: true });

const Agency = mongoose.model('Agency', agencySchema);

// 3. هيكل العمليات والأرباح (Transactions)
const transactionSchema = new mongoose.Schema({
    referenceId: { type: String, unique: true },
    customerEmail: { type: String },
    type: { type: String, enum: ['b2c', 'b2b', 'topup'] },
    packageId: { type: String },
    iccid: { type: String }, // رقم الشريحة الفعلي
    apiCost: { type: Number, required: true }, // تكلفة المزود لحساب الأرباح
    sellingPrice: { type: Number, required: true }, // سعر البيع للعميل
    netMargin: { type: Number }, // الربح الصافي
    whatsappDelivered: { type: Boolean, default: false },
    status: { type: String, enum: ['success', 'failed', 'refunded'], default: 'success' }
}, { timestamps: true });

// حساب الربح الصافي تلقائياً قبل حفظ العملية
transactionSchema.pre('save', function(next) {
    this.netMargin = this.sellingPrice - this.apiCost;
    next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);


// ==========================================
// مسار رئيسي لفحص حالة الخادم
// ==========================================
app.get('/', (req, res) => {
    res.send('Remal Connect API is running with Ultimate B2B/Admin Architecture! 🚀');
});


// ==========================================
// 1. نظام الحسابات (Auth System)
// ==========================================

// تسجيل حساب جديد للأفراد (B2C)
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, whatsapp, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ fullName, email, whatsapp, password: hashedPassword, role: 'customer' });
        await newUser.save();
        res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ داخلي في الخادم' });
    }
});

// تسجيل الدخول الشامل (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

        res.status(200).json({ 
            success: true, 
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role, // مهم لتوجيه المستخدم للوحة التحكم الصحيحة (Admin, CS, Agent)
                walletBalance: user.walletBalance
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء تسجيل الدخول' });
    }
});


// ==========================================
// 2. نظام وكلاء السفر (B2B Portal)
// ==========================================

// تسجيل وكالة سفر جديدة
app.post('/api/b2b/register', async (req, res) => {
    try {
        const { companyName, managerName, email, phone, password, financials, docs } = req.body;
        
        // التحقق من الإيميل
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // إنشاء المستخدم كوكيل
        const newUser = await User.create({ 
            fullName: managerName, 
            email, 
            phone, 
            password: hashedPassword, 
            role: 'agent' 
        });
        
        // حفظ بيانات الوكالة والمستندات
        const newAgency = await Agency.create({
            userId: newUser._id,
            companyName,
            managerName,
            financials,
            documents: docs
        });

        res.status(201).json({ success: true, message: 'تم إرسال طلب الاعتماد بنجاح.' });
    } catch (error) {
        console.error('B2B Register Error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة طلب الوكالة.' });
    }
});


// ==========================================
// 3. مركز القيادة للإدارة العليا (Admin Command Center)
// ==========================================

// اعتماد الوكلاء (KYC Approval)
app.post('/api/admin/approve-kyc', async (req, res) => {
    try {
        const { agencyId, creditLimit } = req.body;
        
        // تحديث حالة الوكالة والحد الائتماني
        const agency = await Agency.findByIdAndUpdate(
            agencyId, 
            { status: 'approved', creditLimit: creditLimit },
            { new: true }
        );

        if (!agency) return res.status(404).json({ success: false, message: 'الوكيل غير موجود' });

        res.json({ success: true, message: 'تم الاعتماد وتفعيل حساب الوكالة بنجاح.', data: agency });
    } catch (error) {
        console.error('KYC Approval Error:', error);
        res.status(500).json({ success: false, message: 'فشل في اعتماد الوكيل.' });
    }
});


// ==========================================
// 4. أتمتة الواتساب (WhatsApp Integration)
// ==========================================
app.post('/api/whatsapp/send-qr', async (req, res) => {
    try {
        const { phone, iccid, qrUrl, country } = req.body;

        const whatsappMessage = `
        مرحباً بك في Remal Connect! 🌍
        رحلة سعيدة إلى *${country}*.
        
        شريحتك الإلكترونية (eSIM) جاهزة للتفعيل:
        رقم الشريحة: ${iccid}
        
        يرجى مسح الرمز المرفق، أو استخدام كود التثبيت اليدوي أدناه:
        LPA:1$smdp.io$${iccid}
        
        فريق شركة الرمال الدولية يتمنى لك سفراً آمناً! ✈️
        `;

        // 🚀 هنا سيتم استدعاء WhatsApp API الفعلي لاحقاً لإرسال الصورة والنص
        // await whatsappProvider.sendMessage(phone, whatsappMessage, qrUrl);
        
        // تحديث قاعدة البيانات في حال الحاجة
        // await Transaction.findOneAndUpdate({ iccid: iccid }, { whatsappDelivered: true });

        res.json({ success: true, message: 'تم تسليم الـ QR عبر الواتساب بنجاح.' });
    } catch (error) {
        console.error('WhatsApp Error:', error);
        res.status(500).json({ success: false, message: 'فشل في الاتصال بخادم الواتساب.' });
    }
});


// ==========================================
// 5. محرك البحث (الباقات المؤقتة - للواجهة)
// ==========================================
app.get('/api/search-packages', async (req, res) => {
    try {
        const searchQuery = req.query.q ? req.query.q.toLowerCase() : '';

        const mockPackages = [
            { id: "p_turkey", country: "تركيا", flag: "🇹🇷", data: "5 GB", validity: "15 يوماً", price: 35, type: "local", isHot: true },
            { id: "p_eu", country: "أوروبا الموحدة", flag: "🇪🇺", data: "10 GB", validity: "30 يوماً", price: 85, type: "regional", isHot: false },
            { id: "p_ksa", country: "السعودية", flag: "🇸🇦", data: "3 GB", validity: "7 أيام", price: 25, type: "local", isHot: false },
            { id: "p_uk", country: "بريطانيا", flag: "🇬🇧", data: "10 GB", validity: "30 يوماً", price: 45, type: "local", isHot: false },
            { id: "p_global", country: "العالمية (Global)", flag: "🌍", data: "20 GB", validity: "365 يوماً", price: 150, type: "global", isHot: false }
        ];

        let results = mockPackages;
        if (searchQuery) {
            results = mockPackages.filter(pkg => pkg.country.toLowerCase().includes(searchQuery));
        }

        res.status(200).json({ success: true, count: results.length, packages: results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء البحث عن الباقات' });
    }
});


// ==========================================
// 6. مسار إصدار الشريحة وشراء الـ eSIM
// ==========================================
app.post('/api/purchase-esim', async (req, res) => {
    const { packageId, customerEmail } = req.body;

    try {
        // 🚀 هنا سيتم ربط API المورد (مثل RateHawk/DOTW) لتوليد الشريحة الفعلي
        
        // محاكاة حفظ العملية في قاعدة البيانات وحساب الربح (Net Margin)
        /*
        const newTransaction = new Transaction({
            referenceId: `ORD-${Math.floor(Math.random() * 10000)}`,
            customerEmail: customerEmail,
            type: 'b2c',
            packageId: packageId,
            iccid: '8985234567890123456',
            apiCost: 15.00, // مثال للتكلفة من المورد
            sellingPrice: 35.00 // مثال لسعر البيع
        });
        await newTransaction.save();
        */

        // إرجاع المحاكاة للواجهة الأمامية
        res.json({
            success: true,
            message: 'تم إصدار الشريحة بنجاح',
            qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LPA:1$smdp.io$8985234567890123456',
            iccid: '8985234567890123456'
        });

    } catch (error) {
        console.error('Error purchasing eSIM:', error.message);
        res.status(500).json({ success: false, message: 'فشل في إصدار الشريحة، يرجى مراجعة الدعم الفني' });
    }
});


// ==========================================
// تشغيل الخادم
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Remal Connect API is running seamlessly on port ${PORT} 🚀`);
});
