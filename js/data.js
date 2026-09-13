// ==========================================
// 🚀 الإعدادات، المتغيرات العامة، والبيانات الثابتة (Data Store)
// ==========================================

// رابط الـ API الحي المباشر (تأكد من عدم تغييره)
const API_URL = 'https://remalsim.com';

// المتغيرات العامة (Global State)
window.allPackages = [];
const exchangeRates = { 'AED': 1, 'SAR': 1.02, 'USD': 0.27, 'EUR': 0.25 };
let currentCurrency = 'AED';

let currentSelectedPackage = null;
let originalPriceAED = 0;
let finalPriceAED = 0;
let walletDeductionAED = 0;
let currentTopupIccid = '';

// خريطة الدول والأعلام للبحث الذكي (يمكنك إضافة المزيد لاحقاً)
const countryMap = {
    'الامارات': { code: 'AE', flag: '🇦🇪', name: 'الإمارات' },
    'الإمارات': { code: 'AE', flag: '🇦🇪', name: 'الإمارات' },
    'السعودية': { code: 'SA', flag: '🇸🇦', name: 'السعودية' },
    'قطر': { code: 'QA', flag: '🇶🇦', name: 'قطر' },
    'عمان': { code: 'OM', flag: '🇴🇲', name: 'سلطنة عمان' },
    'البحرين': { code: 'BH', flag: '🇧🇭', name: 'البحرين' },
    'كويت': { code: 'KW', flag: '🇰🇼', name: 'الكويت' },
    'تركيا': { code: 'TR', flag: '🇹🇷', name: 'تركيا' },
    'أوروبا': { code: 'EU', flag: '🇪🇺', name: 'أوروبا الموحدة' },
    'اوروبا': { code: 'EU', flag: '🇪🇺', name: 'أوروبا الموحدة' },
    'مصر': { code: 'EG', flag: '🇪🇬', name: 'مصر' },
    'بريطانيا': { code: 'GB', flag: '🇬🇧', name: 'بريطانيا' },
    'عالمي': { code: 'GLOBAL', flag: '🌍', name: 'باقة عالمية' },
    'امريكا': { code: 'US', flag: '🇺🇸', name: 'الولايات المتحدة' },
    'أمريكا': { code: 'US', flag: '🇺🇸', name: 'الولايات المتحدة' },
    '': { code: '', flag: '🌍', name: 'الوجهات المتوفرة' } 
};

// ==========================================
// 🛡️ أيقونات الدروع (تم تلوينها بهوية Remal Connect الجديدة)
// ==========================================
const SHIELD_SVGS = {
    // الدرع الفضي (قياسي)
    silver: `<svg viewBox="0 0 100 120" class="w-full h-full drop-shadow-[0_0_15px_rgba(148,163,184,0.4)]"><defs><linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f1f5f9" /><stop offset="50%" stop-color="#94a3b8" /><stop offset="100%" stop-color="#475569" /></linearGradient></defs><path d="M50 5 L90 20 L90 65 Q50 115 50 115 Q50 115 10 65 L10 20 Z" fill="url(#silverGrad)" stroke="#cbd5e1" stroke-width="2"/><path d="M50 15 L80 27 L80 62 Q50 102 50 102 Q50 102 20 62 L20 27 Z" fill="#0c151c" opacity="0.8"/><text x="50" y="65" font-size="26" font-family="Cairo, sans-serif" font-weight="900" fill="#f8fafc" text-anchor="middle">1%</text></svg>`,
    
    // الدرع الذهبي (متقدم)
    gold: `<svg viewBox="0 0 100 120" class="w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"><defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef08a" /><stop offset="50%" stop-color="#eab308" /><stop offset="100%" stop-color="#854d0e" /></linearGradient></defs><path d="M50 5 L90 20 L90 65 Q50 115 50 115 Q50 115 10 65 L10 20 Z" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="2.5"/><path d="M50 15 L80 27 L80 62 Q50 102 50 102 Q50 102 20 62 L20 27 Z" fill="#0c151c" opacity="0.85"/><text x="50" y="66" font-size="22" font-family="Cairo, sans-serif" font-weight="900" fill="#fef08a" text-anchor="middle">1.5%</text></svg>`,
    
    // الدرع البلاتيني (تم تحديثه للون التركواز الفيروزي #00b4d8 الخاص بهويتك)
    platinum: `<svg viewBox="0 0 100 120" class="w-full h-full drop-shadow-[0_0_25px_rgba(0,180,216,0.6)]"><defs><linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#48cae4" /><stop offset="50%" stop-color="#00b4d8" /><stop offset="100%" stop-color="#023e8a" /></linearGradient></defs><path d="M50 5 L90 20 L90 65 Q50 115 50 115 Q50 115 10 65 L10 20 Z" fill="url(#platGrad)" stroke="#48cae4" stroke-width="2.5"/><path d="M50 15 L80 27 L80 62 Q50 102 50 102 Q50 102 20 62 L20 27 Z" fill="#0c151c" opacity="0.85"/><text x="50" y="65" font-size="24" font-family="Cairo, sans-serif" font-weight="900" fill="#48cae4" text-anchor="middle">2%</text></svg>`,
    
    // الدرع الماسي VIP (تم تحديثه للون الأحمر الغامق والياقوتي #800000 الخاص بهويتك)
    diamond: `<svg viewBox="0 0 100 120" class="w-full h-full drop-shadow-[0_0_30px_rgba(128,0,0,0.6)]"><defs><linearGradient id="diamGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff4d4d" /><stop offset="50%" stop-color="#800000" /><stop offset="100%" stop-color="#4a0000" /></linearGradient></defs><path d="M50 5 L90 20 L90 65 Q50 115 50 115 Q50 115 10 65 L10 20 Z" fill="url(#diamGrad)" stroke="#ff4d4d" stroke-width="3"/><path d="M50 15 L80 27 L80 62 Q50 102 50 102 Q50 102 20 62 L20 27 Z" fill="#0c151c" opacity="0.85"/><text x="50" y="65" font-size="24" font-family="Cairo, sans-serif" font-weight="900" fill="#ff4d4d" text-anchor="middle">3%</text></svg>`
};

// ==========================================
// 🚀 دوال إدارة وتخزين البيانات المحلية (Data Handlers)
// ==========================================

// دالة تخزين الشريحة المستخرجة في متصفح العميل
function saveEsimLocally(esimObj) {
    let esims = JSON.parse(localStorage.getItem('rimal_my_esims')) || [];
    
    // إزالة التكرار (إن وجد) بناءً على رقم الشريحة لتحديث بياناتها
    esims = esims.filter(e => e.iccid !== esimObj.iccid);
    
    // إضافة الشريحة الجديدة في أعلى القائمة
    esims.unshift(esimObj); 
    
    localStorage.setItem('rimal_my_esims', JSON.stringify(esims));
}
