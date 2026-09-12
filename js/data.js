const API_URL = '';
window.allPackages = [];
const exchangeRates = { 'AED': 1, 'SAR': 1.02, 'USD': 0.27, 'EUR': 0.25 };
let currentCurrency = 'AED';

const countryMap = {
    'الامارات': { code: 'AE', flag: '🇦🇪', name: 'الإمارات' },
    'الإمارات': { code: 'AE', flag: '🇦🇪', name: 'الإمارات' },
    'السعودية': { code: 'SA', flag: '🇸🇦', name: 'السعودية' },
    'تركيا': { code: 'TR', flag: '🇹🇷', name: 'تركيا' },
    'أوروبا': { code: 'EU', flag: '🇪🇺', name: 'أوروبا الموحدة' },
    'مصر': { code: 'EG', flag: '🇪🇬', name: 'مصر' },
    'بريطانيا': { code: 'GB', flag: '🇬🇧', name: 'بريطانيا' },
    '': { code: '', flag: '🌍', name: 'الوجهات المتوفرة' } 
};
