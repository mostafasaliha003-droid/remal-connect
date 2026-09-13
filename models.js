const mongoose = require('mongoose');

// ==========================================
// 1. هيكل المستخدمين وبرنامج الولاء (Users & Roles)
// ==========================================
const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    whatsapp: { type: String }, // تم التحديث لمطابقة نظام التنبيهات القادم
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['customer', 'agent', 'cs', 'admin'], 
        default: 'customer' 
    },
    walletBalance: { type: Number, default: 0 },
    purchasesCount: { type: Number, default: 0 }, // لتحديد مستوى الدرع والكاش باك
    referralCode: { type: String, unique: true, sparse: true }, // كود المشاركة الفريد
    referredBy: { type: String, default: null }, // كود المستخدم الذي قام بدعوته
    hasCompletedFirstPurchase: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// ==========================================
// 2. هيكل وكلاء السفر (B2B Agencies)
// ==========================================
const AgencySchema = new mongoose.Schema({
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

// ==========================================
// 3. هيكل العمليات والأرباح (Transactions & Margins)
// ==========================================
const TransactionSchema = new mongoose.Schema({
    referenceId: { type: String, unique: true }, // مثال: ORD-169...
    customerEmail: { type: String },
    type: { type: String, enum: ['b2c', 'b2b', 'topup'], default: 'b2c' },
    packageId: { type: String },
    iccid: { type: String },
    apiCost: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    walletDeducted: { type: Number, default: 0 }, // المبلغ المخصوم من الكاش باك
    netMargin: { type: Number },
    esimsCloudLink: { type: String }, // رابط الإدارة السحابية للشريحة
    esimsCloudAccessCode: { type: String },
    whatsappDelivered: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['pending_payment', 'pending_fulfillment', 'success', 'failed', 'refunded'], 
        default: 'pending_payment' 
    }
}, { timestamps: true });

// حساب الربح الصافي تلقائياً قبل الحفظ
TransactionSchema.pre('save', function(next) {
    if (this.sellingPrice !== undefined && this.apiCost !== undefined) {
        this.netMargin = this.sellingPrice - this.apiCost;
    }
    next();
});

// ==========================================
// 4. هيكل الباقات المزامنة من مزود الخدمة (Airalo Packages)
// ==========================================
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

const User = mongoose.model('User', UserSchema);
const Agency = mongoose.model('Agency', AgencySchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const AiraloPackage = mongoose.model('AiraloPackage', packageSchema);

module.exports = { User, Agency, Transaction, AiraloPackage };
