const mongoose = require('mongoose');

// 1. هيكل المستخدمين (Users & Roles)
const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['customer', 'agent', 'cs', 'admin'], // تحديد الصلاحيات بدقة
        default: 'customer' 
    },
    walletBalance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// 2. هيكل وكلاء السفر (B2B Agencies) - Masterstroke
const AgencySchema = new mongoose.Schema({
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
        licenseUrl: String, // روابط الملفات المرفوعة (تخزن في AWS S3 أو ما شابه)
        idUrl: String,
        vatUrl: String
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' // يبدأ كقيد الانتظار لمراجعته في مركز القيادة
    },
    creditLimit: { type: Number, default: 0 }, // سقف الائتمان الذي تحدده الإدارة
    totalIssuedEsims: { type: Number, default: 0 }
}, { timestamps: true });

// 3. هيكل العمليات والأرباح (Transactions & Margins)
const TransactionSchema = new mongoose.Schema({
    referenceId: { type: String, unique: true }, // #ORD-9012
    customerEmail: { type: String },
    type: { type: String, enum: ['b2c', 'b2b', 'topup'] },
    packageId: { type: String },
    iccid: { type: String }, // رقم الشريحة الفعلي
    apiCost: { type: Number, required: true }, // تكلفة مزود الـ eSIM
    sellingPrice: { type: Number, required: true }, // سعر البيع للعميل/الوكيل
    netMargin: { type: Number }, // الربح الصافي (يُحسب تلقائياً)
    whatsappDelivered: { type: Boolean, default: false }, // هل تم الإرسال للواتساب؟
    status: { type: String, enum: ['success', 'failed', 'refunded'], default: 'success' }
}, { timestamps: true });

// حساب الربح الصافي تلقائياً قبل الحفظ (Pre-save Hook)
TransactionSchema.pre('save', function(next) {
    this.netMargin = this.sellingPrice - this.apiCost;
    next();
});

const User = mongoose.model('User', UserSchema);
const Agency = mongoose.model('Agency', AgencySchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { User, Agency, Transaction };
