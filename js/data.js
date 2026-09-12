// 🚀 التوجيه التلقائي: سيكتشف الموقع ما إذا كان يعمل محلياً أو على الإنترنت ويتصل بالسيرفر الصحيح
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
const API_URL = isLocal ? 'http://localhost:3000' : 'https://remalsim.com';

window.allPackages = [];
const exchangeRates = { 'AED': 1, 'SAR': 1.02, 'USD': 0.27, 'EUR': 0.25 };
let currentCurrency = 'AED';

let currentSelectedPackage = null;
let originalPriceAED = 0;
let finalPriceAED = 0;
let walletDeductionAED = 0;
let currentTopupIccid = '';

const countryMap = {
    'الامارات': { code: 'AE', flag: '🇦🇪', name: 'الإمارات' },
    'الإمارات': { code: 'AE', flag: '🇦🇪', name: 'الإمارات' },
    'السعودية': { code: 'SA', flag: '🇸🇦', name: 'السعودية' },
    'تركيا': { code: 'TR', flag: '🇹🇷', name: 'تركيا' },
    'أوروبا': { code: 'EU', flag: '🇪🇺', name: 'أوروبا الموحدة' },
    'اوروبا': { code: 'EU', flag: '🇪🇺', name: 'أوروبا الموحدة' },
    'مصر': { code: 'EG', flag: '🇪🇬', name: 'مصر' },
    'بريطانيا': { code: 'GB', flag: '🇬🇧', name: 'بريطانيا' },
    '': { code: '', flag: '🌍', name: 'الوجهات المتوفرة' } 
};

const SHIELD_SVGS = {
    silver: `<svg viewBox="0 0 100 120" class="w-full h-full drop-shadow-[0_0_15px_rgba(148,163,184,0.4)]"><defs><linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f1f5f9" /><stop offset="50%" stop-color="#94a3b8" /><stop offset="100%" stop-color="#475569" /></linearGradient></defs><path d="M50 5 L90 20 L90 65 Q50 115 50 115 Q50 115 10 65 L10 20 Z" fill="url(#silverGrad)" stroke="#cbd5e1" stroke-width="2"/><path d="M50 15 L80 27 L80 62 Q50 102 50 102 Q50 102 20 62 L20 27 Z" fill="#0b131a" opacity="0.8"/><text x="50" y="65" font-size="26" font-family="Arial" font-weight="900" fill="#f8fafc" text-anchor="middle">1%</text></svg>`,
    gold: `<svg viewBox="0 0 100 120" class="w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"><defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef08a" /><stop offset="50%" stop-color="#eab308" /><stop offset="100%" stop-color="#854d0e" /></linearGradient></defs><path d="M50 5 L90 20 L90 65 Q50 115 50 115 Q50 115 10 65 L10 20 Z" fill="url(#goldGrad)" stroke="#fef08a" stroke-width="2.5"/><path d="M50 15 L80 27 L80 62 Q50 102 50 102 Q50 102 20 62 L20 27 Z" fill="#0b131a" opacity="0.85"/><text x="50" y="66" font-size="22" font-family="Arial" font-weight="900" fill="#fef08a" text-anchor="middle">1.5%</text></svg>`,
    platinum: `<svg viewBox="0 0 100 120" class="w-full h-full drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]"><defs><linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e0f2fe" /><stop offset="50%" stop-color="#22d3ee" /><stop offset="100%" stop-color="#0891b2" /></linearGradient></defs><path d="M50 5 L90 20 L90 65 Q50 115 50 115 Q50 115 10 65 L10 20 Z" fill="url(#platGrad)" stroke="#cffafe" stroke-width="2.5"/><path d="M50 15 L80 27 L80 62 Q50 102 50 102 Q50 102 20 62 L20 27 Z" fill="#0b131a" opacity="0.85"/><text x="50" y="65" font-size="24" font-family="Arial" font-weight="900" fill="#22d3ee" text-anchor="middle">2%</text></svg>`,
    diamond: `<svg viewBox="0 0 100 120" class="w-full h-full drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]"><defs><linearGradient id="diamGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f5d0fe" /><stop offset="50%" stop-color="#c084fc" /><stop offset="100%" stop-color="#6b21a8" /></linearGradient></defs><path d="M50 5 L90 20 L90 65 Q50 115 50 115 Q50 115 10 65 L10 20 Z" fill="url(#diamGrad)" stroke="#f5d0fe" stroke-width="3"/><path d="M50 15 L80 27 L80 62 Q50 102 50 102 Q50 102 20 62 L20 27 Z" fill="#0b131a" opacity="0.85"/><text x="50" y="65" font-size="24" font-family="Arial" font-weight="900" fill="#f5d0fe" text-anchor="middle">3%</text></svg>`
};
