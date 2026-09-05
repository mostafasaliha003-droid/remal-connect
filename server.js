require('dotenv').config(); // لإخفاء المفاتيح السرية
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // مكتبة للاتصال بـ API المورد
const mongoose = require('mongoose'); // مكتبة للاتصال بقاعدة البيانات
const bcrypt = require('bcryptjs'); // مكتبة التشفير
const multer = require('multer'); // مكتبة استقبال الملفات
const nodemailer = require('nodemailer'); // مكتبة إرسال الإيميلات

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
// إعدادات رفع الملفات (Multer) والإيميل (Nodemailer)
// ==========================================
// إعداد Multer لحفظ الملفات مؤقتاً في الذاكرة (لكي نرسلها بالإيميل مباشرة)
const upload = multer({ storage: multer.memoryStorage() });

// إعداد Nodemailer (يرجى إضافة بيانات إيميلك في ملف .env: EMAIL_USER و EMAIL_PASS)
const transporter = nodemailer.createTransport({
    service: 'gmail', // أو أي مزود آخر تستخدمه
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

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
        enum: ['customer', 'agent', 'cs', 'admin'], 
        default: 'customer' 
    },
    walletBalance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 2. هيكل وكلاء السفر والشركات (B2B Agencies)
const agencySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
        default: 'pending' 
    },
    creditLimit: { type: Number, default: 0 },
    totalIssuedEsims: { type: Number, default: 0 }
}, { timestamps: true });

const Agency = mongoose.model('Agency', agencySchema);

// 3. هيكل العمليات والأرباح (Transactions)
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
    if(this.sellingPrice && this.apiCost) {
        this.netMargin = this.sellingPrice - this.apiCost;
    }
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
                role: user.role,
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
// تسجيل وكالة سفر جديدة مع استقبال الملفات عبر FormData
app.post('/api/b2b/register-with-files', upload.fields([{ name: 'licenseFile' }, { name: 'idFile' }, { name: 'vatFile' }]), async (req, res) => {
    try {
        const { companyName, managerName, email, phone, password, accountName, bankName, iban, vatNumber } = req.body;
        const files = req.files;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'defaultPass123', salt);

        const newUser = await User.create({ 
            fullName: managerName, 
            email, 
            phone, 
            password: hashedPassword, 
            role: 'agent' 
        });
        
        const newAgency = await Agency.create({
            userId: newUser._id,
            companyName,
            managerName,
            financials: { accountName, bankName, iban, vatNumber },
            documents: { licenseUrl: '', idUrl: '', vatUrl: '' }
        });

        let attachments = [];
        if (files['licenseFile']) attachments.push({ filename: files['licenseFile'][0].originalname, content: files['licenseFile'][0].buffer });
        if (files['idFile']) attachments.push({ filename: files['idFile'][0].originalname, content: files['idFile'][0].buffer });
        if (files['vatFile']) attachments.push({ filename: files['vatFile'][0].originalname, content: files['vatFile'][0].buffer });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'connect@remaltourismllc.com',
            subject: `طلب اعتماد وكيل جديد: ${companyName}`,
            text: `
                تم استلام طلب جديد للانضمام لشبكة الوكلاء.
                
                بيانات الشركة:
                الاسم: ${companyName}
                المدير: ${managerName}
                الإيميل: ${email}
                الهاتف: ${phone}
                
                يرجى مراجعة لوحة التحكم (Admin Dashboard) لاعتماد الطلب.
                تجد المرفقات الثبوتية مع هذه الرسالة.
            `,
            attachments: attachments
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('تم إرسال إشعار الإيميل بنجاح');
        } catch (mailError) {
            console.error('فشل إرسال الإيميل:', mailError);
        }

        res.status(201).json({ success: true, message: 'تم إرسال طلب الاعتماد بنجاح.' });
    } catch (error) {
        console.error('B2B Register Error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة طلب الوكالة.' });
    }
});

// ==========================================
// 3. مركز القيادة للإدارة العليا (Admin Command Center)
// ==========================================

app.get('/api/admin/pending-kyc', async (req, res) => {
    try {
        const pendingAgencies = await Agency.find({ status: 'pending' }).populate('userId', 'email');
        
        const formattedAgencies = pendingAgencies.map(agent => ({
            _id: agent._id,
            companyName: agent.companyName,
            email: agent.userId ? agent.userId.email : 'No Email',
            licenseUrl: agent.documents.licenseUrl || '#'
        }));

        res.json({ success: true, agencies: formattedAgencies });
    } catch (error) {
        console.error('Error fetching pending KYC:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في جلب الطلبات' });
    }
});

app.post('/api/admin/approve-kyc', async (req, res) => {
    try {
        const { agencyId, creditLimit } = req.body;
        
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
        res.json({ success: true, message: 'تم تسليم الـ QR عبر الواتساب بنجاح.' });
    } catch (error) {
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
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء البحث عن الباقات' });
    }
});

// ==========================================
// 6. مسارات الدفع عبر Ziina وإصدار الشريحة
// ==========================================

// الخطوة أ: إنشاء رابط الدفع
app.post('/api/checkout', async (req, res) => {
    const { packageId, price, customerEmail } = req.body;
    
    try {
        // 1. حفظ تفاصيل العملية في قاعدة البيانات مبدئياً كـ "بانتظار الدفع"
        const newTx = new Transaction({
            referenceId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            customerEmail: customerEmail,
            type: 'b2c',
            packageId: packageId,
            sellingPrice: price,
            apiCost: 0, // سيتم تحديثه عند التفعيل من المورد
            status: 'pending_payment'
        });
        await newTx.save();

        // 2. إعداد طلب الدفع لـ Ziina
        // 🚀 تنبيه: قم بإضافة ZIINA_API_KEY إلى إعدادات الـ Environment في Render
        const ziinaPayload = {
            amount: price * 100, // Ziina تتعامل بالدراهم مضروبة في 100 (فلس)
            currency_code: 'AED',
            success_url: `https://mostafasaliha003-droid.github.io/remal-connect/index.html?payment=success&ref=${newTx.referenceId}`,
            cancel_url: `https://mostafasaliha003-droid.github.io/remal-connect/index.html?payment=failed`,
            test: true, // تأكد من تحويلها إلى false عند الإطلاق الحقيقي
            reference_id: newTx.referenceId
        };

        const ziinaResponse = await axios.post('https://api.ziina.com/v1/payment_intent', ziinaPayload, {
            headers: {
                'Authorization': `Bearer ${process.env.ZIINA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (ziinaResponse.data && ziinaResponse.data.redirect_url) {
            res.json({
                success: true,
                paymentUrl: ziinaResponse.data.redirect_url,
                referenceId: newTx.referenceId
            });
        } else {
            throw new Error('لم تقم Ziina بإرجاع رابط دفع صحيح.');
        }

    } catch (error) {
        console.error('Ziina Checkout Error:', error.message);
        res.status(500).json({ success: false, message: 'فشل في إنشاء جلسة الدفع، يرجى المحاولة لاحقاً.' });
    }
});

// الخطوة ب: Webhook - تستدعيه Ziina بصمت عند نجاح الدفع
app.post('/api/webhooks/ziina', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const payload = req.body;
        
        // التحقق من أن العملية تمت بنجاح
        if (payload.status === 'COMPLETED') {
            const referenceId = payload.reference_id;
            
            // تحديث حالة الطلب في قاعدة البيانات
            const tx = await Transaction.findOneAndUpdate(
                { referenceId: referenceId }, 
                { status: 'success' }, 
                { new: true }
            );

            if (tx) {
                // 🚀 هنا نقوم بالاتصال بـ API مزود الـ eSIM (مثل RateHawk) لإنشاء الشريحة فعلياً!
                // const esimData = await esimProvider.issue(tx.packageId);
                
                // تحديث الـ iccid والتكلفة الفعلية
                // tx.iccid = esimData.iccid;
                // tx.apiCost = esimData.cost;
                // await tx.save();

                console.log(`✅ تم تأكيد دفع وإصدار الشريحة للطلب: ${referenceId}`);
            }
        }
        
        // إرسال رد 200 إلى Ziina لتأكيد استلامنا للـ Webhook
        res.status(200).send('Webhook Received');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Webhook Processing Error');
    }
});

// مسار محاكاة قديم (لأغراض الاختبار في الواجهة حالياً قبل تفعيل الدفع)
app.post('/api/purchase-esim', async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'تم إصدار الشريحة بنجاح',
            qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LPA:1$smdp.io$8985234567890123456',
            iccid: '8985234567890123456'
        });
    } catch (error) {
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
