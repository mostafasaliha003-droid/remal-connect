function quickSearch(country) { 
    document.getElementById('searchInput').value = country; 
    fetchPackages(country); 
    document.getElementById('packagesSection').scrollIntoView({ behavior: 'smooth' }); 
}

async function fetchPackages(query = '') {
    const container = document.getElementById('packagesContainer'), title = document.getElementById('resultsTitle'), btn = document.getElementById('searchBtn');
    let searchKey = query.trim(); let countryInfo = countryMap[searchKey] || { code: '', flag: '🌍', name: searchKey || 'الوجهات المتوفرة' };
    if(btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true; }
    
    let skeletons = ''; for(let i=0; i<4; i++) skeletons += `<div class="glass-card p-6 animate-pulse flex flex-col justify-between h-64 border border-white/5 rounded-3xl"><div class="flex justify-between items-start mb-4"><div class="w-12 h-12 bg-white/10 rounded-2xl"></div><div class="w-20 h-5 bg-white/10 rounded-full"></div></div><div class="space-y-3 mb-4"><div class="h-4 bg-white/10 rounded w-3/4"></div><div class="h-3 bg-white/10 rounded w-1/2"></div></div><div class="grid grid-cols-2 gap-2.5 mb-4"><div class="h-12 bg-black/20 rounded-2xl"></div><div class="h-12 bg-black/20 rounded-2xl"></div></div><div class="h-10 bg-[#06b6d4]/20 rounded-xl w-full"></div></div>`;
    if(container) container.innerHTML = skeletons;

    try {
        const queryParam = countryInfo.code ? `?country=${countryInfo.code}` : '';
        const response = await fetch(`${API_URL}/api/airalo/packages${queryParam}`);
        const data = await response.json();
        if (data.success && data.packages && data.packages.length > 0) {
            if(title) title.innerHTML = query ? `نتائج البحث عن: <span class="text-brand-cyan">${countryInfo.name}</span>` : 'باقات الإنترنت الدولي 🔥';
            window.allPackages = data.packages.map((pkg) => ({ id: pkg.id || pkg.package_id || 'pkg_default', country: pkg.country || countryInfo.name, flag: countryInfo.flag || '🌍', data: pkg.data || 'غير محدد', validity: pkg.validity || '7 أيام', price: parseFloat(pkg.sellingPrice || pkg.price || 35.00).toFixed(2), type: pkg.type || 'local', isHot: pkg.isHot || false }));
            renderPackages(window.allPackages);
        } else if (container) container.innerHTML = `<div class="col-span-full text-center text-rose-500 font-bold py-10 bg-red-500/10 rounded-2xl border border-red-500/20">عذراً، لم نتمكن من العثور على باقات لهذه الوجهة حالياً.</div>`;
    } catch (error) {
        if(container) container.innerHTML = `<div class="col-span-full text-center text-rose-500 font-bold py-10 bg-red-500/10 rounded-2xl border border-red-500/20">حدث خطأ في جلب الباقات، يرجى تحديث الصفحة.</div>`;
    } finally { if(btn) { btn.innerHTML = 'ابحث عن وجهتك <i class="fa-solid fa-earth-americas"></i>'; btn.disabled = false; } }
}

function renderPackages(packages) {
    const container = document.getElementById('packagesContainer');
    if (!container) return;
    let html = '';
    packages.forEach((pkg, index) => {
        const delay = index * 40;
        const hotBadge = pkg.isHot ? `<span class="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-[10px] font-black shadow-[0_0_10px_rgba(244,63,94,0.25)]">🔥 الأكثر طلباً</span>` : `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">⚡ تفعيل فوري</span>`;
        html += `
        <div class="glass-card rounded-3xl p-6 flex flex-col justify-between animate-fade-in-up group" style="animation-delay: ${delay}ms;">
            <div>
                <div class="flex items-center justify-between mb-5 relative z-10"><div class="flex items-center gap-3.5"><div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">${pkg.flag}</div><div class="text-right"><h4 class="font-black text-lg text-white mb-0.5 tracking-tight">${pkg.country}</h4><span class="text-brand-cyan text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 5G تغطية فائقة</span></div></div>${hotBadge}</div>
                <div class="grid grid-cols-2 gap-2.5 mb-5 relative z-10"><div class="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center group-hover:border-brand-cyan/30 transition-colors"><span class="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><i class="fa-solid fa-database text-brand-cyan"></i> البيانات</span><span class="font-black text-base text-white" dir="ltr">${pkg.data}</span></div><div class="bg-black/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center group-hover:border-brand-cyan/30 transition-colors"><span class="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1"><i class="fa-regular fa-clock text-brand-cyan"></i> الصلاحية</span><span class="font-black text-base text-white">${pkg.validity}</span></div></div>
                <div class="mb-5 bg-emerald-950/25 border border-emerald-500/20 py-1.5 px-3 rounded-xl flex items-center justify-between text-[11px] font-bold text-emerald-300"><span>كاش باك فوري لمحفظتك</span><span class="font-black text-emerald-400">حتى 3% 💰</span></div>
            </div>
            <div class="flex items-center justify-between border-t border-white/10 pt-4 relative z-10">
                <div class="text-right flex flex-col">
                    <span class="block text-[9px] font-bold text-slate-400 mb-0.5">السعر الشامل</span>
                    <div class="flex items-baseline gap-1" dir="ltr"><span class="font-black text-2xl text-white price-val drop-shadow-md" data-aed="${pkg.price}">${pkg.price}</span><span class="text-[10px] font-black text-brand-cyan">AED</span></div>
                    <div class="flex gap-1.5 mt-1.5 opacity-50"><i class="fa-brands fa-cc-visa text-xs text-white"></i><i class="fa-brands fa-cc-mastercard text-xs text-white"></i><i class="fa-brands fa-apple-pay text-xs text-white"></i></div>
                </div>
                <button aria-label="شراء الباقة" onclick="openCheckoutModalByIndex(${index})" class="masterstroke-btn text-white px-5 py-3 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer border-none shadow-[0_0_20px_rgba(6,182,216,0.4)] hover:shadow-[0_0_30px_rgba(6,182,216,0.6)]">فعّل باقتك فوراً <i class="fa-solid fa-bolt text-[10px]"></i></button>
            </div>
        </div>`;
    });
    container.innerHTML = html; convertCurrency(); 
}

function renderMyEsims() {
    const container = document.getElementById('myEsimsContainer');
    const esims = JSON.parse(localStorage.getItem('rimal_my_esims')) || [];
    if (esims.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-20 glass-card rounded-3xl border border-white/5"><div class="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-brand-cyan text-4xl shadow-inner border border-white/10"><i class="fa-solid fa-box-open"></i></div><p class="text-white font-black text-2xl mb-3">حقيبة السفر الرقمية فارغة حالياً</p><p class="text-slate-400 font-bold text-sm mb-8 max-w-md mx-auto">اشترِ باقتك الأولى وسنقوم بحفظها هنا للوصول السريع حتى في وضع الطيران!</p><button onclick="switchView('homeView')" class="masterstroke-btn text-white px-10 py-4 rounded-xl font-black text-sm transition-transform active:scale-95 border-none cursor-pointer shadow-[0_0_20px_rgba(6,182,216,0.3)]">تصفح الباقات العالمية</button></div>`;
        return;
    }
    let html = '';
    esims.forEach((esim) => {
        const lpaString = esim.lpa || `LPA:1$smdp.io$${esim.iccid}`;
        let totalMB = esim.totalBytes || 3072, usedMB = esim.usedBytes || 0;
        let percentage = (usedMB / totalMB) * 100;
        let progressColor = percentage > 85 ? 'from-rose-500 to-red-600' : 'from-[#06b6d4] to-emerald-400';
        html += `<div class="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-8 rounded-[2rem]"><div class="w-full md:w-3/5 flex flex-col justify-between relative z-10"><div><div class="flex justify-between items-start mb-6"><div><span class="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[9px] font-black tracking-wide mb-2">🟢 الشريحة فعالة</span><h3 class="text-3xl font-black text-white flex items-center gap-3 drop-shadow-md">${esim.country} <span class="text-3xl filter drop-shadow-lg">${esim.flag}</span></h3></div><div class="text-left bg-black/20 p-2 rounded-lg border border-white/5"><span class="block text-[9px] text-slate-400 font-bold mb-0.5">تاريخ الشراء</span><span class="block text-xs font-bold text-slate-200" dir="ltr">${esim.date}</span></div></div><div class="mb-6"><div class="flex justify-between text-xs font-bold mb-2"><span class="text-slate-300">الاستهلاك المباشر</span><span class="text-white bg-black/40 px-2.5 py-1 rounded-md border border-white/5" dir="ltr">${(usedMB/1024).toFixed(2)} GB / ${(totalMB/1024).toFixed(2)} GB</span></div><div class="w-full bg-[#050B14] rounded-full h-3 overflow-hidden border border-white/5 shadow-inner"><div class="bg-gradient-to-r ${progressColor} h-3 rounded-full progress-bar-fill shadow-[0_0_10px_rgba(6,182,216,0.6)]" style="width: 0%" data-width="${percentage}%"></div></div><div class="mt-4 flex flex-wrap gap-2.5"><button aria-label="شحن الرصيد" onclick="openTopupModal('${esim.iccid}')" class="bg-white hover:bg-slate-200 text-[#030712] px-5 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-2 shadow-md border-none"><i class="fa-solid fa-bolt text-brand-cyan"></i> شحن الرصيد</button><button aria-label="إرشادات التثبيت" onclick="fetchInstructions('${esim.iccid}')" class="bg-white/5 hover:bg-white/10 text-brand-cyan border border-brand-cyan/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"><i class="fa-solid fa-book-open"></i> إرشادات التثبيت</button></div></div><div class="flex flex-wrap gap-3"><div class="bg-black/30 border border-white/5 p-3 rounded-xl flex-1 min-w-[120px]"><span class="block text-[9px] text-slate-400 font-bold mb-1"><i class="fa-solid fa-sim-card text-brand-cyan ml-1"></i>رقم الشريحة (ICCID)</span><span class="block font-black text-xs text-white tracking-widest truncate" dir="ltr">${esim.iccid}</span></div><div class="bg-black/30 border border-white/5 p-3 rounded-xl flex-1 min-w-[100px]"><span class="block text-[9px] text-slate-400 font-bold mb-1"><i class="fa-solid fa-clock text-brand-cyan ml-1"></i>الصلاحية المتبقية</span><span class="block font-black text-sm text-emerald-400">14 يوماً</span></div></div></div></div><div class="w-full md:w-2/5 flex flex-col items-center justify-center border-t md:border-t-0 md:border-r border-white/5 pt-6 md:pt-0 md:pr-6 relative"><div class="qr-frame mb-4 w-44 h-44 z-10"><img src="${esim.qrUrl}" alt="QR Code" class="w-full h-full object-cover rounded-xl" /></div><button aria-label="تثبيت ذكي" onclick="installSmartEsim('${lpaString}')" class="w-full masterstroke-btn text-white py-3 rounded-xl font-black text-xs shadow-[0_0_15px_rgba(6,182,216,0.3)] flex items-center justify-center gap-2 border-none cursor-pointer transition-colors relative z-10 mb-2.5"><i class="fa-solid fa-mobile-button text-sm"></i> تثبيت تلقائي (ذكي)</button><button aria-label="تحميل QR" onclick="downloadQrCode('${esim.qrUrl}', '${esim.country}')" class="w-full bg-black hover:bg-[#0A101C] text-white py-2.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-colors relative z-10 mb-4 shadow-sm"><i class="fa-solid fa-download text-brand-cyan"></i> حفظ رمز QR في الصور</button><div class="w-full bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 text-right"><p class="text-[9px] text-amber-400 font-bold mb-1.5 flex items-center gap-1"><i class="fa-solid fa-circle-info"></i> رمز التثبيت اليدوي (LPA):</p><div class="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-amber-500/20 cursor-pointer hover:border-amber-400 transition-colors" onclick="copyToClipboard('${lpaString}', this)"><span class="text-[9px] font-black text-slate-300 truncate mr-1 flex-1" dir="ltr">${lpaString}</span><button aria-label="نسخ رمز التثبيت" class="bg-amber-500 text-slate-900 w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer pointer-events-none shrink-0"><i class="fa-regular fa-copy text-[10px]"></i></button></div></div></div></div>`;
    });
    container.innerHTML = html;
    setTimeout(() => { document.querySelectorAll('.progress-bar-fill').forEach(bar => { bar.style.width = bar.getAttribute('data-width'); }); }, 100);
}

async function processSecurePayment() {
    const btn = document.getElementById('payNowBtn'), user = getSavedUser(), targetEmail = user ? user.email : 'guest@remalsim.com';
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-lg"></i> جاري معالجة الطلب...'; btn.disabled = true;
    localStorage.setItem('pending_esim_package', JSON.stringify({ ...currentSelectedPackage, walletDeducted: walletDeductionAED, paidAmount: finalPriceAED }));

    if (finalPriceAED <= 0) {
        user.walletBalance = Math.max(0, (user.walletBalance || 0) - walletDeductionAED); saveUserPersistent(user);
        setTimeout(() => { closeCheckoutModal(); window.location.href = `index.html?payment=success&ref=WAL-${Date.now()}`; }, 1000); return;
    }
    try {
        const res = await fetch(`${API_URL}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: currentSelectedPackage.id, price: finalPriceAED, walletDeducted: walletDeductionAED, customerEmail: targetEmail }) });
        const data = await res.json();
        if (data.success && data.paymentUrl) window.location.href = data.paymentUrl; else { showToast(data.message || 'فشل في تهيئة الدفع', true); btn.innerHTML = 'دفع الآن'; btn.disabled = false; }
    } catch (error) { showToast('حدث خطأ في الاتصال بالخادم.', true); btn.innerHTML = 'دفع الآن'; btn.disabled = false; }
}

async function processTopupPayment() {
    const btn = document.getElementById('confirmTopupBtn'), selectedOption = document.querySelector('input[name="topupOption"]:checked').value, [gb, price] = selectedOption.split('|'), user = getSavedUser();
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري فتح بوابة الدفع...'; btn.disabled = true;
    try {
        localStorage.setItem('pending_topup_order', JSON.stringify({ iccid: currentTopupIccid, gb: parseInt(gb), price: parseFloat(price) }));
        const res = await fetch(`${API_URL}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: `topup_${currentTopupIccid}_${gb}gb`, price: parseFloat(price), customerEmail: user ? user.email : 'guest@remalsim.com' }) });
        const data = await res.json();
        if (data.success && data.paymentUrl) window.location.href = data.paymentUrl; else { showToast(data.message || 'تعذر بدء الدفع', true); btn.innerHTML = 'الانتقال للدفع الآمن <i class="fa-solid fa-lock"></i>'; btn.disabled = false; }
    } catch (err) { showToast('خطأ في الاتصال', true); btn.innerHTML = 'الانتقال للدفع الآمن <i class="fa-solid fa-lock"></i>'; btn.disabled = false; }
}

async function verifyPaymentAndFulfill() {
    const urlParams = new URLSearchParams(window.location.search), paymentStatus = urlParams.get('payment'), referenceId = urlParams.get('ref');
    if (paymentStatus === 'success' && referenceId) {
        switchView('dashboardView');
        const pendingTopupStr = localStorage.getItem('pending_topup_order');
        if (pendingTopupStr) {
            const topupData = JSON.parse(pendingTopupStr); let esims = JSON.parse(localStorage.getItem('rimal_my_esims')) || []; const index = esims.findIndex(e => e.iccid === topupData.iccid);
            if (index > -1) { esims[index].totalBytes += topupData.gb * 1024; localStorage.setItem('rimal_my_esims', JSON.stringify(esims)); }
            localStorage.removeItem('pending_topup_order'); showToast(`🎉 تم شحن ${topupData.gb}GB بنجاح للشريحة!`); renderMyEsims(); window.history.replaceState({}, document.title, window.location.pathname); return;
        }

        showToast('✅ تم استلام الدفع! جاري استخراج الشريحة...');
        try {
            let data = { success: true, iccid: `890000${Date.now().toString().slice(-9)}`, qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LPA:1$remalsim.com$TEST' };
            if (!referenceId.startsWith('WAL-')) { const res = await fetch(`${API_URL}/api/fulfill-esim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referenceId }) }); data = await res.json(); }
            if (data.success) {
                const pendingPkg = JSON.parse(localStorage.getItem('pending_esim_package')) || { country: 'الإمارات', flag: '🇦🇪', data: '3 GB', price: '35.00' };
                saveEsimLocally({ ...pendingPkg, iccid: data.iccid, qrUrl: data.qr_code_url, lpa: data.lpa || `LPA:1$smdp.io$${data.iccid}`, date: new Date().toISOString().split('T')[0], totalBytes: (parseInt(pendingPkg.data) || 3) * 1024, usedBytes: 0 });
                const user = getSavedUser();
                if (user) {
                    const purchasesCount = parseInt(user.purchasesCount || 0), tier = getTierInfo(purchasesCount), actualPaid = parseFloat(pendingPkg.paidAmount !== undefined ? pendingPkg.paidAmount : pendingPkg.price), earnedCashback = parseFloat((actualPaid * tier.rate).toFixed(2));
                    let newBalance = parseFloat(user.walletBalance || 0);
                    if (pendingPkg.walletDeducted) newBalance = Math.max(0, newBalance - parseFloat(pendingPkg.walletDeducted));
                    user.walletBalance = newBalance + earnedCashback; user.purchasesCount = purchasesCount + 1; saveUserPersistent(user); updateAuthUI(); updateDashboardVIP();
                    if (earnedCashback > 0) showToast(`🎉 مبروك! حصلت على كاش باك ${earnedCashback} AED!`); else showToast('🎉 تمت إضافة الشريحة لمحفظتك بنجاح!');
                }
                renderMyEsims();
            } else showToast(data.message || 'حدث خطأ أثناء استخراج الشريحة', true);
        } catch (err) { showToast('خطأ في الاتصال أثناء استلام الشريحة', true); } finally { window.history.replaceState({}, document.title, window.location.pathname); localStorage.removeItem('pending_esim_package'); }
    } else if (paymentStatus === 'failed') { showToast('❌ تعذر إتمام عملية الدفع.', true); window.history.replaceState({}, document.title, window.location.pathname); }
}

function installSmartEsim(lpaString) {
    if (!lpaString) return; navigator.clipboard.writeText(lpaString).catch(() => {});
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) { showToast('جاري فتح معالج الآيفون...'); window.location.href = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpaString)}`; }
    else { showToast('تم نسخ رمز LPA! انتقل إلى الإعدادات لإضافة eSIM'); alert(`لتثبيت الشريحة على أندرويد:\n1. تم نسخ رمز التفعيل (LPA).\n2. اذهب إلى: الضبط > الاتصالات > إدارة بطاقة SIM > إضافة eSIM.\n3. الصق الرمز.`); }
}

function downloadQrCode(qrUrl, countryName) {
    if (!qrUrl) return; showToast('جاري فتح الصورة لحفظها...');
    const newTab = window.open(); newTab.document.write(`<html dir="rtl"><head><title>كود eSIM</title></head><body style="background:#030712;color:white;text-align:center;font-family:sans-serif;padding:30px;"><h2>رمز تفعيل شريحة ${countryName}</h2><p style="color:#06b6d4;">اضغط مطولاً على الصورة ثم اختر حفظ</p><img src="${qrUrl}" style="max-width:300px;border-radius:15px;background:white;padding:10px;margin-top:20px;" /></body></html>`);
}

async function fetchInstructions(iccid) {
    const modal = document.getElementById('instructionsModal'), content = document.getElementById('instructionsContent'), body = document.getElementById('instructionsBody');
    modal.classList.remove('hidden'); setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-y-10'); }, 10);
    body.innerHTML = `<div class="flex flex-col items-center justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan mb-3"></div><p class="text-xs text-slate-400">جاري جلب الإرشادات...</p></div>`;
    try {
        const res = await fetch(`${API_URL}/api/airalo/instructions/${iccid}?lang=ar`), data = await res.json();
        if (data.success && data.instructions) {
            let html = ''; const inst = data.instructions;
            if (inst.ios && inst.ios.length > 0) { html += `<div class="mb-4"><h4 class="text-brand-cyan font-bold mb-2">🍎 أجهزة أبل (iOS):</h4>`; inst.ios.forEach(item => { if (item.installation_manual && item.installation_manual.steps) { html += `<div class="bg-black/30 p-3 rounded-xl mb-2 text-xs">`; Object.values(item.installation_manual.steps).forEach((stepText, sIdx) => { html += `<p class="mb-1 text-slate-300"><strong>خطوة ${sIdx + 1}:</strong> ${stepText}</p>`; }); html += `</div>`; } }); html += `</div>`; }
            if (inst.android && inst.android.length > 0) { html += `<div><h4 class="text-emerald-400 font-bold mb-2">🤖 أجهزة أندرويد:</h4>`; inst.android.forEach(item => { if (item.installation_manual && item.installation_manual.steps) { html += `<div class="bg-black/30 p-3 rounded-xl mb-2 text-xs">`; Object.values(item.installation_manual.steps).forEach((stepText, sIdx) => { html += `<p class="mb-1 text-slate-300"><strong>خطوة ${sIdx + 1}:</strong> ${stepText}</p>`; }); html += `</div>`; } }); html += `</div>`; }
            body.innerHTML = html || '<p class="text-center text-slate-400">لا توجد إرشادات متاحة.</p>';
        } else body.innerHTML = '<p class="text-center text-rose-400">تعذر تحميل الإرشادات.</p>';
    } catch (err) { body.innerHTML = '<p class="text-center text-rose-400">حدث خطأ في الاتصال.</p>'; }
}

function openCheckoutModalByIndex(index) {
    const pkg = window.allPackages[index];
    if (!pkg) return;
    currentSelectedPackage = pkg; originalPriceAED = parseFloat(pkg.price); finalPriceAED = originalPriceAED; walletDeductionAED = 0;
    
    document.getElementById('modalCountry').innerText = `${pkg.country} ${pkg.flag}`; 
    document.getElementById('modalData').innerText = pkg.data; 
    document.getElementById('modalOriginalPrice').innerText = originalPriceAED.toFixed(2); 
    document.getElementById('modalFinalPrice').innerText = finalPriceAED.toFixed(2);
    
    const user = getSavedUser(), actionArea = document.getElementById('checkoutActionArea'), walletArea = document.getElementById('walletDeductionArea'), walletCheckbox = document.getElementById('useWalletCheckbox');
    if (user) {
        if (parseFloat(user.walletBalance || 0) > 0) { 
            walletArea.classList.remove('hidden'); 
            document.getElementById('availableWalletLabel').innerText = `الرصيد المتاح: ${parseFloat(user.walletBalance).toFixed(2)} AED`; 
            walletCheckbox.checked = false; 
            document.getElementById('deductedAmountLabel').innerText = '-0.00 AED'; 
        } else {
            walletArea.classList.add('hidden');
        }
        updateCheckoutButtonUI(finalPriceAED);
    } else {
        walletArea.classList.add('hidden'); 
        actionArea.innerHTML = `<div class="text-center mb-4"><span class="text-xs font-bold text-slate-400">يجب تسجيل الدخول لإتمام الشراء</span></div><a href="register.html" class="w-full masterstroke-btn text-white font-black py-4 rounded-xl shadow-[0_0_15px_rgba(6,182,216,0.3)] transition-transform active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer text-sm decoration-none">تسجيل الدخول <i class="fa-regular fa-user"></i></a>`;
    }
    const modal = document.getElementById('checkoutModal'), content = document.getElementById('checkoutContent');
    modal.classList.remove('hidden'); setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-y-10'); }, 10);
}
