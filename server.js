require('dotenv').config(); // لإخفاء المفاتيح السرية
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // مكتبة للاتصال بـ API المورد

const app = express();

// إعدادات الحماية والوصول
app.use(express.json());
app.use(cors({
    origin: ['https://mostafasaliha003-droid.github.io'], // السماح لموقعك فقط بالاتصال بالخادم
    methods: ['GET', 'POST']
}));

// ==========================================
// 1. مسار (Endpoint) لجلب الباقات من المورد
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
// 2. مسار (Endpoint) لإنشاء الشريحة بعد الدفع
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
