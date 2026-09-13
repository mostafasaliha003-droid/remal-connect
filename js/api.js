// تم إزالة السطر الخاص بـ API_URL من هنا لأنه معرف بالفعل في ملف data.js

// ==========================================
// 🚀 إعدادات البحث وجلب البيانات
// ==========================================

function quickSearch(country) { 
    document.getElementById('searchInput').value = country; 
    fetchPackages(country); 
    document.getElementById('packagesSection').scrollIntoView({ behavior: 'smooth' }); 
}

// 🚀 دالة مخصصة لزر "عرض المزيد" تعتمد على كود الدولة
function searchByCountryCode(code, name) {
    document.getElementById('searchInput').value = name; 
    fetchPackages(name, code); 
    document.getElementById('packagesSection').scrollIntoView({ behavior: 'smooth' }); 
}

async function fetchPackages(query = '', directCode = null) {
    const container = document.getElementById('packagesContainer'), title = document.getElementById('resultsTitle'), btn = document.getElementById('searchBtn');
    let searchKey = query.trim(); 
    let countryInfo = typeof countryMap !== 'undefined' && countryMap[searchKey] ? countryMap[searchKey] : { code: '', flag: '🌍', name: searchKey || 'الوجهات المتوفرة' };
    
    // إذا تم الضغط على زر "عرض المزيد"، نستخدم كود الدولة المباشر
    if (directCode) countryInfo = { code: directCode, flag: '🌍', name: searchKey };

    if(btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true; }
    
    // 🎨 الهيكل التحميلي (Skeleton) متوافق مع Glassmorphism
    let skeletons = ''; 
    for(let i=0; i<4; i++) skeletons += `
        <div class="bg-black/40 backdrop-blur-md p-6 animate-pulse flex flex-col justify-between h-64 border border-[#00b4d8]/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div class="flex justify-between items-start mb-4"><div class="w-12 h-12 bg-white/5 rounded-2xl border border-white/10"></div><div class="w-20 h-5 bg-white/5 rounded-full"></div></div>
            <div class="space-y-3 mb-4"><div class="h-4 bg-white/5 rounded w-3/4"></div><div class="h-3 bg-white/5 rounded w-1/2"></div></div>
            <div class="grid grid-cols-2 gap-2.5 mb-4"><div class="h-12 bg-black/20 rounded-2xl"></div><div class="h-12 bg-black/20 rounded-2xl"></div></div>
            <div class="h-10 bg-[#00b4d8]/20 rounded-xl w-full"></div>
        </div>`;
    if(container) container.innerHTML = skeletons;

    try {
        const queryParam = countryInfo.code ? `?country=${countryInfo.code}` : '';
        const response = await fetch(`${API_URL}/api/airalo/packages${queryParam}`);
        const data = await response.json();
        
        if (data.success && data.packages && data.packages.length > 0) {
            if(title) title.innerHTML = query ? `نتائج البحث عن: <span class="text-[#00b4d8] drop-shadow-md">${countryInfo.name}</span>` : 'أهم الوجهات العالمية 🔥';
            window.allPackages = data.packages.map((pkg) => ({ 
                id: pkg.id || pkg.package_id || 'pkg_default', 
                country: pkg.country || countryInfo.name, 
                country_code: pkg.country_code || '',
                flag: countryInfo.flag !== '🌍' ? countryInfo.flag : (pkg.country_code === 'TR'?'🇹🇷':pkg.country_code === 'AE'?'🇦🇪':pkg.country_code === 'SA'?'🇸🇦':pkg.country_code === 'GB'?'🇬🇧':pkg.country_code === 'FR'?'🇫🇷':pkg.country_code === 'EG'?'🇪🇬':pkg.country_code === 'US'?'🇺🇸':'🌍'), 
                data: pkg.data || 'غير محدد', 
                validity: pkg.validity || '7 أيام', 
                price: parseFloat(pkg.sellingPrice || pkg.price || 35.00).toFixed(2), 
                type: pkg.type || 'local', 
                isHot: pkg.isHot || false 
            }));
            if(typeof renderPackages === 'function') renderPackages(window.allPackages, data.isFeatured);
        } else if (container) {
            container.innerHTML = `<div class="col-span-full text-center text-[#ff4d4d] font-bold py-10 bg-[#800000]/20 backdrop-blur-md rounded-2xl border border-[#800000]/50 shadow-[0_0_15px_rgba(128,0,0,0.3)]">عذراً، لم نتمكن من العثور على باقات لهذه الوجهة حالياً. قد يكون السيرفر يزامن الباقات الآن.</div>`;
        }
    } catch (error) {
        if(container) container.innerHTML = `<div class="col-span-full text-center text-[#ff4d4d] font-bold py-10 bg-[#800000]/20 backdrop-blur-md rounded-2xl border border-[#800000]/50 shadow-[0_0_15px_rgba(128,0,0,0.3)]">حدث خطأ في الاتصال بالخادم، يرجى تحديث الصفحة.</div>`;
        console.error("Fetch Error:", error);
    } finally { 
        if(btn) { btn.innerHTML = 'ابحث عن وجهتك <i class="fa-solid fa-earth-americas"></i>'; btn.disabled = false; } 
    }
}

// ==========================================
// 🚀 عرض الباقات (B2C Storefront)
// ==========================================
function renderPackages(packages, isFeatured = false) {
    const container = document.getElementById('packagesContainer');
    if (!container) return;
    let html = '';
    
    packages.forEach((pkg, index) => {
        // تطبيق الأحمر الغامق للباقات المميزة
        const hotBadge = pkg.isHot 
            ? `<span class="bg-[#800000]/30 text-[#ff4d4d] border border-[#800000]/50 px-2.5 py-1 rounded-full text-[10px] font-black shadow-[0_0_10px_rgba(128,0,0,0.4)]">🔥 غير محدود</span>` 
            : `<span class="bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/30 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-[0_0_10px_rgba(0,180,216,0.2)]">⚡ تفعيل فوري</span>`;
            
        // 🚀 زر "عرض المزيد" يظهر فقط في الشاشة الرئيسية لأهم 10 دول
        let moreBtn = isFeatured ? `<button onclick="searchByCountryCode('${pkg.country_code}', '${pkg.country}')" class="mt-3 w-full bg-black/40 border border-white/10 hover:border-[#00b4d8]/50 hover:bg-[#00b4d8]/10 text-slate-300 hover:text-[#00b4d8] py-2 rounded-xl text-[10px] font-bold transition-colors shadow-sm flex items-center justify-center gap-2">عرض كل باقات ${pkg.country} <i class="fa-solid fa-arrow-left text-[9px]"></i></button>` : '';

        // تم إزالة style="opacity: 0" من الـ div لكي تظهر البطاقات بشكل طبيعي
        html += `
        <div class="bg-black/40 backdrop-blur-xl border border-white/5 hover:border-[#00b4d8]/30 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,180,216,0.15)] group">
            <div>
                <div class="flex items-center justify-between mb-5 relative z-10">
                    <div class="flex items-center gap-3.5">
                        <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">${pkg.flag}</div>
                        <div class="text-right">
                            <h4 class="font-black text-lg text-white mb-0.5 tracking-tight">${pkg.country}</h4>
                            <span class="text-[#00b4d8] text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-[#00b4d8] animate-pulse shadow-[0_0_5px_#00b4d8]"></span> 5G تغطية فائقة</span>
                        </div>
                    </div>
                    ${hotBadge}
                </div>
                
                <div class="grid grid-cols-2 gap-2.5 mb-5 relative z-10">
                    <div class="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center group-hover:bg-[#00b4d8]/5 transition-colors">
                        <span class="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><i class="fa-solid fa-database text-[#00b4d8]"></i> البيانات</span>
                        <span class="font-black text-base text-white" dir="ltr">${pkg.data}</span>
                    </div>
                    <div class="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center group-hover:bg-[#00b4d8]/5 transition-colors">
                        <span class="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><i class="fa-regular fa-clock text-[#00b4d8]"></i> الصلاحية</span>
                        <span class="font-black text-base text-white">${pkg.validity}</span>
                    </div>
                </div>
                
                <div class="mb-5 bg-[#00b4d8]/10 border border-[#00b4d8]/20 py-1.5 px-3 rounded-xl flex items-center justify-between text-[11px] font-bold text-[#00b4d8]">
                    <span>كاش باك فوري لمحفظتك</span><span class="font-black text-white drop-shadow-md">حتى 3% 💰</span>
                </div>
            </div>
            
            <div class="flex flex-col relative z-10 border-t border-white/10 pt-4">
                <div class="flex items-center justify-between w-full mb-3">
                    <div class="text-right flex flex-col">
                        <span class="block text-[9px] font-bold text-slate-400 mb-0.5">السعر الشامل</span>
                        <div class="flex items-baseline gap-1" dir="ltr">
                            <span class="font-black text-2xl text-white price-val drop-shadow-[0_0_8px_rgba(0,180,216,0.3)]" data-aed="${pkg.price}">${pkg.price}</span>
                            <span class="text-[10px] font-black text-[#00b4d8]">AED</span>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button aria-label="شراء الباقة" onclick="openCheckoutModalByIndex(${index})" class="bg-[#00b4d8] hover:bg-[#0096b4] text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-none shadow-[0_0_15px_rgba(0,180,216,0.4)] hover:shadow-[0_0_25px_rgba(0,180,216,0.6)]">
                            شراء الآن <i class="fa-solid fa-bolt"></i>
                        </button>
                    </div>
                </div>
                <!-- 🚀 زر التفاصيل المتقدمة (يستدعي مسار Product Information) -->
                <button onclick="fetchPackageDetails('${pkg.id}')" class="mb-3 bg-transparent border border-white/10 hover:border-[#00b4d8]/50 text-slate-300 hover:text-[#00b4d8] px-5 py-1.5 rounded-xl font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                    تفاصيل الشبكة <i class="fa-solid fa-circle-info"></i>
                </button>
                <!-- إضافة زر عرض المزيد هنا -->
                ${moreBtn}
            </div>
        </div>`;
    });
    container.innerHTML = html; 
    if(typeof convertCurrency === 'function') convertCurrency(); 
}

// ==========================================
// 🚀 جلب تفاصيل الباقة (Product Information)
// ==========================================
async function fetchPackageDetails(slug) {
    if(typeof showToast === 'function') showToast('جاري جلب تفاصيل الشبكة والتغطية...');
    try {
        const res = await fetch(`${API_URL}/api/airalo/packages/${slug}/info`);
        const data = await res.json();
        if(data.success && data.info) {
            console.log("تفاصيل الباقة:", data.info);
            alert(`مزودي الخدمة: ${data.info.network_providers.join(' - ')}\nالسرعة المدعومة: ${data.info.network_technologies.join(' - ')}\nالاستخدام العادل: ${data.info.is_fair_usage_policy ? 'نعم' : 'لا'}`);
        } else {
            if(typeof showToast === 'function') showToast('تعذر جلب تفاصيل هذه الباقة حالياً', true);
        }
    } catch (err) {
        if(typeof showToast === 'function') showToast('خطأ في الاتصال بالخادم', true);
    }
}

// ==========================================
// 🚀 عرض الشرائح المشتراة (My eSIMs Dashboard)
// ==========================================
function renderMyEsims() {
    const container = document.getElementById('myEsimsContainer');
    if(!container) return;
    const esims = JSON.parse(localStorage.getItem('rimal_my_esims')) || [];
    
    if (esims.length === 0) {
        container.innerHTML = `
        <div class="col-span-full text-center py-20 bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div class="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#00b4d8] text-4xl shadow-inner border border-[#00b4d8]/20"><i class="fa-solid fa-box-open"></i></div>
            <p class="text-white font-black text-2xl mb-3 drop-shadow-md">حقيبة السفر الرقمية فارغة حالياً</p>
            <p class="text-slate-400 font-bold text-sm mb-8 max-w-md mx-auto">اشترِ باقتك الأولى وسنقوم بحفظها هنا للوصول السريع حتى في وضع الطيران!</p>
            <button onclick="if(typeof switchView==='function') switchView('homeView')" class="bg-[#00b4d8] hover:bg-[#0096b4] text-white px-10 py-4 rounded-xl font-black text-sm transition-transform active:scale-95 border-none cursor-pointer shadow-[0_0_20px_rgba(0,180,216,0.4)]">تصفح الباقات العالمية</button>
        </div>`;
        return;
    }
    
    let html = '';
    esims.forEach((esim) => {
        const lpaString = esim.lpa || `LPA:1$smdp.io$${esim.iccid}`;
        let totalMB = esim.totalBytes || 3072, usedMB = esim.usedBytes || 0;
        let percentage = (usedMB / totalMB) * 100;
        
        let progressColor = percentage > 85 ? 'from-[#800000] to-[#ff4d4d] shadow-[0_0_15px_rgba(128,0,0,0.6)]' : 'from-[#00b4d8] to-[#48cae4] shadow-[0_0_15px_rgba(0,180,216,0.6)]';
        let statusBadge = percentage > 85 ? '🔴 شريحة توشك على الانتهاء' : '🟢 الشريحة فعالة';
        let statusColor = percentage > 85 ? 'bg-[#800000]/20 text-[#ff4d4d] border-[#800000]/30' : 'bg-[#00b4d8]/10 text-[#00b4d8] border-[#00b4d8]/30';

        let cloudButtonHtml = '';
        if(esim.cloudLink) {
            cloudButtonHtml = `
            <div class="mt-4 bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                <div>
                    <span class="block text-[9px] text-slate-400 font-bold mb-0.5">الإدارة السحابية المتقدمة</span>
                    <span class="block text-xs font-black text-[#00b4d8]">كود الدخول: ${esim.cloudCode || '---'}</span>
                </div>
                <a href="${esim.cloudLink}" target="_blank" class="bg-[#00b4d8] hover:bg-[#0096b4] text-white px-4 py-2 rounded-lg text-xs font-black transition-colors text-decoration-none shadow-md flex items-center gap-1.5">
                    <i class="fa-solid fa-cloud"></i> السحابة
                </a>
            </div>`;
        }

        html += `
        <div class="bg-black/40 backdrop-blur-xl border border-white/5 hover:border-[#00b4d8]/20 p-6 md:p-8 flex flex-col md:flex-row gap-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] mb-6 transition-colors">
            <div class="w-full md:w-3/5 flex flex-col justify-between relative z-10">
                <div>
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <span class="inline-block ${statusColor} border px-2.5 py-1 rounded text-[9px] font-black tracking-wide mb-2">${statusBadge}</span>
                            <h3 class="text-3xl font-black text-white flex items-center gap-3 drop-shadow-md">${esim.country} <span class="text-3xl filter drop-shadow-lg">${esim.flag}</span></h3>
                        </div>
                        <div class="text-left bg-black/40 p-2 rounded-lg border border-white/5">
                            <span class="block text-[9px] text-slate-400 font-bold mb-0.5">تاريخ الشراء</span>
                            <span class="block text-xs font-bold text-slate-200" dir="ltr">${esim.date}</span>
                        </div>
                    </div>
                    <div class="mb-6">
                        <div class="flex justify-between text-xs font-bold mb-2">
                            <span class="text-slate-300">الاستهلاك المباشر</span>
                            <span class="text-white bg-black/60 px-2.5 py-1 rounded-md border border-white/5" dir="ltr">${(usedMB/1024).toFixed(2)} GB / ${(totalMB/1024).toFixed(2)} GB</span>
                        </div>
                        <div class="w-full bg-[#050B14] rounded-full h-3 overflow-hidden border border-white/5 shadow-inner">
                            <div class="bg-gradient-to-r ${progressColor} h-3 rounded-full progress-bar-fill transition-all duration-1000 ease-out" style="width: 0%" data-width="${percentage}%"></div>
                        </div>
                        <div class="mt-4 flex flex-wrap gap-2.5">
                            <button aria-label="شحن الرصيد" onclick="if(typeof openTopupModal==='function') openTopupModal('${esim.iccid}')" class="bg-[#00b4d8] hover:bg-[#0096b4] text-white px-5 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(0,180,216,0.3)] border-none">
                                <i class="fa-solid fa-bolt text-yellow-300"></i> شحن الرصيد
                            </button>
                            <button aria-label="إرشادات التثبيت" onclick="if(typeof fetchInstructions==='function') fetchInstructions('${esim.iccid}')" class="bg-transparent hover:bg-white/5 text-[#00b4d8] border border-[#00b4d8]/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                                <i class="fa-solid fa-book-open"></i> الإرشادات
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-3">
                        <div class="bg-black/50 border border-white/5 p-3 rounded-xl flex-1 min-w-[120px]">
                            <span class="block text-[9px] text-slate-400 font-bold mb-1"><i class="fa-solid fa-sim-card text-[#00b4d8] ml-1"></i>رقم الشريحة (ICCID)</span>
                            <span class="block font-black text-xs text-white tracking-widest truncate" dir="ltr">${esim.iccid}</span>
                        </div>
                        <div class="bg-black/50 border border-white/5 p-3 rounded-xl flex-1 min-w-[100px]">
                            <span class="block text-[9px] text-slate-400 font-bold mb-1"><i class="fa-solid fa-clock text-[#00b4d8] ml-1"></i>الصلاحية المتبقية</span>
                            <span class="block font-black text-sm text-[#00b4d8]">14 يوماً</span>
                        </div>
                    </div>
                    ${cloudButtonHtml}
                </div>
            </div>
            
            <div class="w-full md:w-2/5 flex flex-col items-center justify-center border-t md:border-t-0 md:border-r border-white/10 pt-6 md:pt-0 md:pr-6 relative">
                <div class="bg-white p-2 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-4 w-44 h-44 z-10">
                    <img src="${esim.qrUrl}" alt="QR Code" class="w-full h-full object-cover rounded-xl" />
                </div>
                <button aria-label="تثبيت ذكي" onclick="if(typeof installSmartEsim==='function') installSmartEsim('${lpaString}')" class="w-full bg-white text-black py-3 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 border-none cursor-pointer hover:bg-gray-200 transition-colors relative z-10 mb-2.5">
                    <i class="fa-brands fa-apple text-sm"></i> تثبيت تلقائي للآيفون
                </button>
                <button aria-label="تحميل QR" onclick="if(typeof downloadQrCode==='function') downloadQrCode('${esim.qrUrl}', '${esim.country}')" class="w-full bg-black hover:bg-[#0A101C] text-white py-2.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-colors relative z-10 mb-4 shadow-sm">
                    <i class="fa-solid fa-download text-[#00b4d8]"></i> حفظ رمز QR في الصور
                </button>
                <div class="w-full bg-[#00b4d8]/10 p-3 rounded-xl border border-[#00b4d8]/30 text-right">
                    <p class="text-[9px] text-[#00b4d8] font-bold mb-1.5 flex items-center gap-1"><i class="fa-solid fa-circle-info"></i> رمز التثبيت اليدوي (LPA):</p>
                    <div class="flex justify-between items-center bg-black/60 p-2 rounded-lg border border-white/5 cursor-pointer hover:border-[#00b4d8]/50 transition-colors" onclick="copyToClipboard('${lpaString}', this)">
                        <span class="text-[9px] font-black text-slate-300 truncate mr-1 flex-1" dir="ltr">${lpaString}</span>
                        <button aria-label="نسخ رمز التثبيت" class="bg-[#00b4d8] text-white w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer pointer-events-none shrink-0"><i class="fa-regular fa-copy text-[10px]"></i></button>
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    setTimeout(() => { document.querySelectorAll('.progress-bar-fill').forEach(bar => { bar.style.width = bar.getAttribute('data-width'); }); }, 150);
}

// ==========================================
// 🚀 عمليات الدفع وتسليم الشريحة
// ==========================================
async function processSecurePayment() {
    const btn = document.getElementById('payNowBtn'), user = typeof getSavedUser === 'function' ? getSavedUser() : null, targetEmail = user ? user.email : 'guest@remalsim.com';
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-lg"></i> جاري إعداد الشريحة...'; btn.disabled = true;
    localStorage.setItem('pending_esim_package', JSON.stringify({ ...currentSelectedPackage, walletDeducted: typeof walletDeductionAED !== 'undefined' ? walletDeductionAED : 0, paidAmount: typeof finalPriceAED !== 'undefined' ? finalPriceAED : currentSelectedPackage.price }));

    if (typeof finalPriceAED !== 'undefined' && finalPriceAED <= 0) {
        if(user) { user.walletBalance = Math.max(0, (user.walletBalance || 0) - walletDeductionAED); if(typeof saveUserPersistent==='function') saveUserPersistent(user); }
        setTimeout(() => { if(typeof closeCheckoutModal === 'function') closeCheckoutModal(); window.location.href = `index.html?payment=success&ref=WAL-${Date.now()}`; }, 1000); 
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: currentSelectedPackage.id, price: finalPriceAED || currentSelectedPackage.price, walletDeducted: typeof walletDeductionAED !== 'undefined' ? walletDeductionAED : 0, customerEmail: targetEmail }) });
        const data = await res.json();
        if (data.success && data.paymentUrl) window.location.href = data.paymentUrl; 
        else { if(typeof showToast==='function') showToast(data.message || 'فشل في تهيئة الدفع', true); btn.innerHTML = 'دفع الآن <i class="fa-solid fa-bolt"></i>'; btn.disabled = false; }
    } catch (error) { 
        if(typeof showToast==='function') showToast('حدث خطأ في الاتصال بالسيرفر.', true); btn.innerHTML = 'دفع الآن <i class="fa-solid fa-bolt"></i>'; btn.disabled = false; 
    }
}

async function processTopupPayment() {
    const btn = document.getElementById('confirmTopupBtn'), selectedOption = document.querySelector('input[name="topupOption"]:checked').value, [gb, price] = selectedOption.split('|'), user = typeof getSavedUser === 'function' ? getSavedUser() : null;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تهيئة إعادة الشحن...'; btn.disabled = true;
    try {
        localStorage.setItem('pending_topup_order', JSON.stringify({ iccid: currentTopupIccid, gb: parseInt(gb), price: parseFloat(price) }));
        const res = await fetch(`${API_URL}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: `topup_${currentTopupIccid}_${gb}gb`, price: parseFloat(price), customerEmail: user ? user.email : 'guest@remalsim.com' }) });
        const data = await res.json();
        if (data.success && data.paymentUrl) window.location.href = data.paymentUrl; 
        else { if(typeof showToast==='function') showToast(data.message || 'تعذر بدء الدفع', true); btn.innerHTML = 'دفع آمن <i class="fa-solid fa-lock"></i>'; btn.disabled = false; }
    } catch (err) { if(typeof showToast==='function') showToast('خطأ في الاتصال', true); btn.innerHTML = 'دفع آمن <i class="fa-solid fa-lock"></i>'; btn.disabled = false; }
}

async function verifyPaymentAndFulfill() {
    const urlParams = new URLSearchParams(window.location.search), paymentStatus = urlParams.get('payment'), referenceId = urlParams.get('ref');
    if (paymentStatus === 'success' && referenceId) {
        if(typeof switchView === 'function') switchView('dashboardView');
        const pendingTopupStr = localStorage.getItem('pending_topup_order');
        
        if (pendingTopupStr) {
            const topupData = JSON.parse(pendingTopupStr); 
            let esims = JSON.parse(localStorage.getItem('rimal_my_esims')) || []; 
            const index = esims.findIndex(e => e.iccid === topupData.iccid);
            if (index > -1) { esims[index].totalBytes += topupData.gb * 1024; localStorage.setItem('rimal_my_esims', JSON.stringify(esims)); }
            localStorage.removeItem('pending_topup_order'); 
            if(typeof showToast==='function') showToast(`🎉 تم شحن ${topupData.gb}GB بنجاح لشريحتك!`); 
            renderMyEsims(); 
            window.history.replaceState({}, document.title, window.location.pathname); 
            return;
        }

        if(typeof showToast==='function') showToast('✅ الدفع ناجح! جاري استخراج الشريحة الآن...');
        try {
            let data = { success: false };
            if (referenceId.startsWith('WAL-')) {
                const res = await fetch(`${API_URL}/api/fulfill-esim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referenceId }) });
                data = await res.json();
            } else { 
                const res = await fetch(`${API_URL}/api/fulfill-esim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referenceId }) }); 
                data = await res.json(); 
            }
            
            if (data.success && data.iccid) {
                const pendingPkg = JSON.parse(localStorage.getItem('pending_esim_package')) || { country: 'وجهة عالمية', flag: '🌍', data: 'N/A', price: '0.00' };
                if(typeof saveEsimLocally === 'function') {
                    saveEsimLocally({ 
                        ...pendingPkg, 
                        iccid: data.iccid, 
                        qrUrl: data.qr_code_url, 
                        lpa: data.lpa || `LPA:1$smdp.io$${data.iccid}`, 
                        cloudLink: data.esims_cloud_link || null,
                        cloudCode: data.esims_cloud_access_code || null,
                        date: new Date().toISOString().split('T')[0], 
                        totalBytes: (parseInt(pendingPkg.data) || 1) * 1024, 
                        usedBytes: 0 
                    });
                }
                const user = typeof getSavedUser === 'function' ? getSavedUser() : null;
                if (user && data.earnedCashback > 0) {
                    user.walletBalance = (user.walletBalance || 0) + data.earnedCashback;
                    if(typeof saveUserPersistent === 'function') saveUserPersistent(user);
                    if(typeof showToast==='function') showToast(`🎉 تمت استخراج الشريحة وكسبت كاش باك ${data.earnedCashback} AED!`);
                } else {
                    if(typeof showToast==='function') showToast('🎉 تم استخراج الشريحة وإضافتها للوحة التحكم!');
                }
                renderMyEsims();
            } else if(typeof showToast==='function') showToast(data.message || 'حدث خطأ في النظام أثناء الاستخراج', true);
        } catch (err) { 
            if(typeof showToast==='function') showToast('الشبكة ضعيفة! ستجد شريحتك في لوحة التحكم قريباً.', true); 
        } finally { 
            window.history.replaceState({}, document.title, window.location.pathname); 
            localStorage.removeItem('pending_esim_package'); 
        }
    } else if (paymentStatus === 'failed') { 
        if(typeof showToast==='function') showToast('❌ تعذر إتمام عملية الدفع.', true); 
        window.history.replaceState({}, document.title, window.location.pathname); 
    }
}

// ==========================================
// 🚀 الأدوات المساعدة (Helpers)
// ==========================================
function installSmartEsim(lpaString) {
    if (!lpaString) return; navigator.clipboard.writeText(lpaString).catch(() => {});
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) { 
        if(typeof showToast==='function') showToast('جاري التوجيه لتطبيق الإعدادات...'); 
        window.location.href = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpaString)}`; 
    }
    else { 
        if(typeof showToast==='function') showToast('تم نسخ رمز LPA! انتقل للإعدادات'); 
        alert(`تم نسخ رمز التفعيل.\nاذهب إلى إعدادات الهاتف > الاتصالات > إدارة بطاقة SIM > إضافة eSIM > أدخل الرمز يدوياً والصقه.`); 
    }
}

function downloadQrCode(qrUrl, countryName) {
    if (!qrUrl) return; 
    if(typeof showToast==='function') showToast('جاري تحضير الـ QR Code...');
    const newTab = window.open(); 
    newTab.document.write(`<html dir="rtl"><head><title>كود eSIM</title></head><body style="background:#050a0f;color:white;text-align:center;font-family:sans-serif;padding:30px;"><h2>رمز تفعيل شريحة ${countryName}</h2><p style="color:#00b4d8;">خذ لقطة شاشة (Screenshot) أو اضغط مطولاً للحفظ</p><img src="${qrUrl}" style="max-width:300px;border-radius:20px;background:white;padding:15px;margin-top:20px;box-shadow: 0 0 20px rgba(0,180,216,0.5);" /></body></html>`);
}

async function fetchInstructions(iccid) {
    const modal = document.getElementById('instructionsModal'), content = document.getElementById('instructionsContent'), body = document.getElementById('instructionsBody');
    if(!modal) return;
    modal.classList.remove('hidden'); setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-y-10'); }, 10);
    body.innerHTML = `<div class="flex flex-col items-center justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00b4d8] mb-3"></div><p class="text-xs text-slate-400">جاري تحميل إرشادات التثبيت الآمن...</p></div>`;
    try {
        const res = await fetch(`${API_URL}/api/airalo/instructions/${iccid}?lang=ar`), data = await res.json();
        if (data.success && data.instructions) {
            let html = ''; const inst = data.instructions;
            if (inst.ios && inst.ios.length > 0) { 
                html += `<div class="mb-4"><h4 class="text-white font-bold mb-2 flex items-center gap-2"><i class="fa-brands fa-apple text-xl"></i> أجهزة أبل (iOS):</h4>`; 
                inst.ios.forEach(item => { if (item.installation_manual && item.installation_manual.steps) { html += `<div class="bg-black/40 border border-white/5 p-3 rounded-xl mb-2 text-xs">`; Object.values(item.installation_manual.steps).forEach((stepText, sIdx) => { html += `<p class="mb-1 text-slate-300"><strong>خطوة ${sIdx + 1}:</strong> ${stepText}</p>`; }); html += `</div>`; } }); html += `</div>`; 
            }
            if (inst.android && inst.android.length > 0) { 
                html += `<div><h4 class="text-[#00b4d8] font-bold mb-2 flex items-center gap-2"><i class="fa-brands fa-android text-xl"></i> أجهزة أندرويد:</h4>`; 
                inst.android.forEach(item => { if (item.installation_manual && item.installation_manual.steps) { html += `<div class="bg-black/40 border border-white/5 p-3 rounded-xl mb-2 text-xs">`; Object.values(item.installation_manual.steps).forEach((stepText, sIdx) => { html += `<p class="mb-1 text-slate-300"><strong>خطوة ${sIdx + 1}:</strong> ${stepText}</p>`; }); html += `</div>`; } }); html += `</div>`; 
            }
            body.innerHTML = html || '<p class="text-center text-slate-400">لا توجد إرشادات متاحة.</p>';
        } else body.innerHTML = '<p class="text-center text-[#ff4d4d]">تعذر تحميل الإرشادات من المزوّد.</p>';
    } catch (err) { body.innerHTML = '<p class="text-center text-[#ff4d4d]">حدث خطأ في الاتصال بالشبكة.</p>'; }
}

function openCheckoutModalByIndex(index) {
    const pkg = window.allPackages[index];
    if (!pkg) return;
    currentSelectedPackage = pkg; originalPriceAED = parseFloat(pkg.price); finalPriceAED = originalPriceAED; walletDeductionAED = 0;
    
    const countryEl = document.getElementById('modalCountry'), dataEl = document.getElementById('modalData'), opEl = document.getElementById('modalOriginalPrice'), fpEl = document.getElementById('modalFinalPrice');
    if(countryEl) countryEl.innerText = `${pkg.country} ${pkg.flag}`; 
    if(dataEl) dataEl.innerText = pkg.data; 
    if(opEl) opEl.innerText = originalPriceAED.toFixed(2); 
    if(fpEl) fpEl.innerText = finalPriceAED.toFixed(2);
    
    const user = typeof getSavedUser === 'function' ? getSavedUser() : null, actionArea = document.getElementById('checkoutActionArea'), walletArea = document.getElementById('walletDeductionArea'), walletCheckbox = document.getElementById('useWalletCheckbox');
    if (user && actionArea) {
        if (parseFloat(user.walletBalance || 0) > 0 && walletArea) { 
            walletArea.classList.remove('hidden'); 
            document.getElementById('availableWalletLabel').innerText = `الرصيد المتاح: ${parseFloat(user.walletBalance).toFixed(2)} AED`; 
            if(walletCheckbox) walletCheckbox.checked = false; 
            if(document.getElementById('deductedAmountLabel')) document.getElementById('deductedAmountLabel').innerText = '-0.00 AED'; 
        } else if (walletArea) {
            walletArea.classList.add('hidden');
        }
        if(typeof updateCheckoutButtonUI === 'function') updateCheckoutButtonUI(finalPriceAED);
    } else if (actionArea && walletArea) {
        walletArea.classList.add('hidden'); 
        actionArea.innerHTML = `<div class="text-center mb-4"><span class="text-xs font-bold text-slate-400">يجب تسجيل الدخول لإتمام الشراء الآمن</span></div><a href="register.html" class="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white font-black py-4 rounded-xl shadow-[0_0_15px_rgba(0,180,216,0.3)] transition-transform active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer text-sm decoration-none">تسجيل الدخول <i class="fa-regular fa-user"></i></a>`;
    }
    const modal = document.getElementById('checkoutModal'), content = document.getElementById('checkoutContent');
    if(modal && content) {
        modal.classList.remove('hidden'); 
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-y-10'); }, 10);
    }
}
