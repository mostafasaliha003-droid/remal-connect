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

// إنشاء هيكل بيانات المستخدم (Schema)
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    whatsapp: { type: String },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ==========================================
// مسار رئيسي لفحص حالة الخادم
// ==========================================
app.get('/', (req, res) => {
    res.send('Remal Connect API is running with Ultimate UI support! 🚀');
});

// ==========================================
// 1. نظام الحسابات: إنشاء حساب جديد (Register)
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, whatsapp, password } = req.body;

        // التحقق من أن البريد غير مسجل مسبقاً
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });
        }

        // تشفير كلمة المرور
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // حفظ المستخدم الجديد
        const newUser = new User({
            fullName,
            email,
            whatsapp,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ داخلي في الخادم' });
    }
});

// ==========================================
// 2. نظام الحسابات: تسجيل الدخول (Login) - (جديد)
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // البحث عن المستخدم
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }

        // مطابقة كلمة المرور المشفّرة
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }

        // إرسال بيانات المستخدم (بدون كلمة المرور) للواجهة
        res.status(200).json({ 
            success: true, 
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء تسجيل الدخول' });
    }
});

// ==========================================
// 3. محرك البحث عن باقات الـ eSIM - (معدل للعمل مع الواجهة الجديدة)
// ==========================================
app.get('/api/search-packages', async (req, res) => {
    try {
        const searchQuery = req.query.q ? req.query.q.toLowerCase() : '';

        // 💡 ملاحظة: هذا "محاكي مؤقت" (Mock Data) لكي يعمل محرك البحث في موقعك فوراً
        // بمجرد حصولك على مفاتيح API المورد (مثل RateHawk/Airalo للـ eSIM)، سنقوم باستبدال هذه المصفوفة بطلب Axios حقيقي
        const mockPackages = [
            { id: "p_turkey", country: "تركيا", flag: "🇹🇷", data: "5 GB", validity: "15 يوماً", price: 35, type: "local", isHot: true },
            { id: "p_eu", country: "أوروبا الموحدة", flag: "🇪🇺", data: "10 GB", validity: "30 يوماً", price: 85, type: "regional", isHot: false },
            { id: "p_ksa", country: "السعودية", flag: "🇸🇦", data: "3 GB", validity: "7 أيام", price: 25, type: "local", isHot: false },
            { id: "p_uk", country: "بريطانيا", flag: "🇬🇧", data: "10 GB", validity: "30 يوماً", price: 45, type: "local", isHot: false },
            { id: "p_global", country: "العالمية (Global)", flag: "🌍", data: "20 GB", validity: "365 يوماً", price: 150, type: "global", isHot: false }
        ];

        // فلترة النتائج بناءً على بحث المستخدم
        let results = mockPackages;
        if (searchQuery) {
            results = mockPackages.filter(pkg => 
                pkg.country.toLowerCase().includes(searchQuery)
            );
        }

        // إرجاع النتائج للواجهة الأمامية
        res.status(200).json({
            success: true,
            count: results.length,
            packages: results
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء البحث عن الباقات' });
    }
});

// ==========================================
// 4. مسار إصدار الشريحة بعد الدفع (جاهز للربط الفعلي)
// ==========================================
app.post('/api/purchase-esim', async (req, res) => {
    const { packageId, customerEmail } = req.body;

    try {
        // سيتم تفعيل هذا الكود بمجرد استلام وثائق المورد (API Docs)
        /*
        const orderResponse = await axios.post('https://api.esim-supplier.com/v1/orders', {
            package_id: packageId,
            email: customerEmail
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.SUPPLIER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        */

        // محاكاة نجاح عملية الشراء للواجهة الأمامية
        res.json({
            success: true,
            message: 'تم إصدار الشريحة بنجاح (وضع المحاكاة)',
            qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=MOCK_ESIM_DATA_FOR_REMAL_CONNECT',
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
    console.log(`✅ Remal Connect API is running on port ${PORT} 🚀`);
});
