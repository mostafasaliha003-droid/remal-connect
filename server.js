require('dotenv').config(); // لإخفاء المفاتيح السرية
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // مكتبة للاتصال بـ API المورد
const mongoose = require('mongoose'); // مكتبة للاتصال بقاعدة البيانات
const bcrypt = require('bcryptjs'); // مكتبة التشفير

const app = express();

// إعدادات الحماية والوصول
app.use(express.json());
app.use(cors({
    origin: ['https://mostafasaliha003-droid.github.io'], // السماح لموقعك فقط بالاتصال بالخادم
    methods: ['GET', 'POST']
}));

// ==========================================
// الاتصال بقاعدة بيانات MongoDB
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ متصل بقاعدة بيانات MongoDB بنجاح'))
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
// مسار رئيسي لفحص حالة الخادم (لتجنب خطأ Cannot GET /)
// ==========================================
app.get('/', (req, res) => {
    res.send('Remal Connect API is running perfectly! 🚀');
});

// ==========================================
// 1. مسار (Endpoint) لإنشاء حساب جديد
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

        // حفظ المستخدم الجديد في قاعدة البيانات
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
// 2. مسار (Endpoint) لجلب الباقات من المورد
// ==========================================
app.get('/api/packages', async (req, res) => {
    try {
        // هنا يتم وضع رابط API المورد
        const supplierResponse = await axios.get('https://api.esim-supplier.com/v1/packages', {
            headers: {
                'Authorization': `Bearer ${process.env.SUPPLIER_API_KEY}` // المفتاح السري الآمن
            }
        });
        
        // إرسال الباقات إلى واجهة موقعك
        res.json(supplierResponse.data);
    } catch (error) {
        console.error('Error fetching packages:', error.message);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الباقات' });
    }
});

// ==========================================
// 3. مسار (Endpoint) لإنشاء الشريحة بعد الدفع
// ==========================================
app.post('/api/purchase-esim', async (req, res) => {
    const { packageId, customerEmail } = req.body;

    try {
        // طلب إصدار شريحة جديدة من المورد
        const orderResponse = await axios.post('https://api.esim-supplier.com/v1/orders', {
            package_id: packageId,
            email: customerEmail
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.SUPPLIER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // إرجاع كود الـ QR للعميل ليعرض في الواجهة
        res.json({
            success: true,
            message: 'تم إصدار الشريحة بنجاح',
            qr_code_url: orderResponse.data.qr_code_url,
            iccid: orderResponse.data.iccid
        });

    } catch (error) {
        console.error('Error purchasing eSIM:', error.message);
        res.status(500).json({ error: 'فشل في إصدار الشريحة، يرجى مراجعة الدعم الفني' });
    }
});

// ==========================================
// تشغيل الخادم
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Remal Connect API is running on port ${PORT} 🚀`);
});
