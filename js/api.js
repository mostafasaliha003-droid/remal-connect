async function fetchPackages(query = '') {
    const container = document.getElementById('packagesContainer');
    const title = document.getElementById('resultsTitle');
    const btn = document.getElementById('searchBtn');
    if(btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true; }
    
    let searchKey = query.trim();
    let countryInfo = countryMap[searchKey] || { code: '', flag: '🌍', name: searchKey || 'الوجهات المتوفرة' };

    try {
        // Simulating API call for modular example
        setTimeout(() => {
            window.allPackages = [
                { id: '1', country: 'الإمارات', flag: '🇦🇪', data: '3 GB', validity: '7 أيام', price: '35.00', isHot: true },
                { id: '2', country: 'السعودية', flag: '🇸🇦', data: '5 GB', validity: '15 يوم', price: '50.00', isHot: false }
            ];
            renderPackages(window.allPackages);
            if(btn) { btn.innerHTML = 'اختر وجهتك <i class="fa-solid fa-earth-americas"></i>'; btn.disabled = false; }
        }, 800);
    } catch (error) {
        if(container) container.innerHTML = `<div class="col-span-full text-center text-brand-red font-bold py-10 bg-brand-red/10 rounded-2xl border border-brand-red/20">حدث خطأ في جلب الباقات.</div>`;
    }
}

function renderPackages(packages) {
    const container = document.getElementById('packagesContainer');
    if (!container) return;

    let html = '';
    packages.forEach((pkg, index) => {
        const delay = index * 40;
        const hotBadge = pkg.isHot 
            ? `<span class="bg-brand-red/15 text-red-400 border border-brand-red/30 px-2.5 py-1 rounded-full text-[10px] font-black shadow-[0_0_10px_rgba(128,0,0,0.25)]">🔥 الأكثر طلباً</span>` 
            : `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">⚡ تفعيل فوري</span>`;
        
        html += `
        <div class="glass-card rounded-3xl p-6 flex flex-col justify-between animate-fade-in-up group" style="animation-delay: ${delay}ms;">
            <div>
                <div class="flex items-center justify-between mb-5 relative z-10">
                    <div class="flex items-center gap-3.5">
                        <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">${pkg.flag}</div>
                        <div class="text-right">
                            <h4 class="font-black text-lg text-white mb-0.5 tracking-tight">${pkg.country}</h4>
                            <span class="text-brand-cyan text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 5G تغطية فائقة
                            </span>
                        </div>
                    </div>
                    ${hotBadge}
                </div>
                <div class="grid grid-cols-2 gap-2.5 mb-5 relative z-10">
                    <div class="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center group-hover:border-brand-cyan/30 transition-colors">
                        <span class="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><i class="fa-solid fa-database text-brand-cyan"></i> البيانات</span>
                        <span class="font-black text-base text-white" dir="ltr">${pkg.data}</span>
                    </div>
                    <div class="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center group-hover:border-brand-cyan/30 transition-colors">
                        <span class="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><i class="fa-regular fa-clock text-brand-cyan"></i> الصلاحية</span>
                        <span class="font-black text-base text-white">${pkg.validity}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-between border-t border-white/10 pt-4 relative z-10">
                <div class="text-right">
                    <span class="block text-[9px] font-bold text-slate-400 mb-0.5">السعر الشامل</span>
                    <div class="flex items-baseline gap-1" dir="ltr">
                        <span class="font-black text-2xl text-white price-val drop-shadow-md" data-aed="${pkg.price}">${pkg.price}</span>
                        <span class="text-[10px] font-black text-brand-cyan">AED</span>
                    </div>
                </div>
                <button onclick="showToast('جاري تحويلك للدفع...')" class="masterstroke-btn text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border-none shadow-[0_0_20px_rgba(0,180,216,0.35)]">
                    شراء وتفعيل <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
    convertCurrency();
}
