async function fetchPackages(query = '') {
    const container = document.getElementById('packagesContainer');
    const title = document.getElementById('resultsTitle');
    const btn = document.getElementById('searchBtn');
    const originalBtnHtml = btn ? btn.innerHTML : '';
    
    let searchKey = query.trim();
    let countryInfo = countryMap[searchKey] || { code: '', flag: '🌍', name: searchKey || 'الوجهات المتوفرة' };

    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true; }
    
    let skeletons = '';
    for(let i=0; i<4; i++) {
        skeletons += `<div class="glass-card p-6 animate-pulse flex flex-col justify-between h-64 border border-white/5 rounded-3xl"><div class="flex justify-between items-start mb-4"><div class="w-12 h-12 bg-white/10 rounded-2xl"></div><div class="w-20 h-5 bg-white/10 rounded-full"></div></div><div class="space-y-3 mb-4"><div class="h-4 bg-white/10 rounded w-3/4"></div><div class="h-3 bg-white/10 rounded w-1/2"></div></div><div class="grid grid-cols-2 gap-2.5 mb-4"><div class="h-12 bg-black/20 rounded-2xl"></div><div class="h-12 bg-black/20 rounded-2xl"></div></div><div class="h-10 bg-[#06b6d4]/20 rounded-xl w-full"></div></div>`;
    }
    if (container) container.innerHTML = skeletons;

    try {
        const queryParam = countryInfo.code ? `?country=${countryInfo.code}` : '';
        const response = await fetch(`${API_URL}/api/airalo/packages${queryParam}`);
        const data = await response.json();
        
        if (data.success && data.packages && data.packages.length > 0) {
            if (title) title.innerHTML = query ? `نتائج البحث عن: <span class="text-brand-cyan">${countryInfo.name}</span>` : 'تذاكر العبور للإنترنت العالمي 🔥';
            window.allPackages = data.packages.map((pkg) => {
                return {
                    id: pkg.id || pkg.package_id || 'pkg_default',
                    country: pkg.country || countryInfo.name,
                    flag: countryInfo.flag || '🌍',
                    data: pkg.data || 'غير محدد',
                    validity: pkg.validity || '7 أيام',
                    price: parseFloat(pkg.sellingPrice || pkg.price || 35.00).toFixed(2),
                    type: pkg.type || 'local',
                    isHot: pkg.isHot || false
                };
            });
            renderPackages(window.allPackages);
        } else {
            if (container) container.innerHTML = `<div class="col-span-full text-center text-rose-500 font-bold py-10 bg-red-500/10 rounded-2xl border border-red-500/20">عذراً، لم نتمكن من العثور على باقات لهذه الوجهة حالياً.</div>`;
        }
    } catch (error) {
        if (container) container.innerHTML = `<div class="col-span-full text-center text-rose-500 font-bold py-10 bg-red-500/10 rounded-2xl border border-red-500/20">حدث خطأ في جلب الباقات، يرجى تحديث الصفحة.</div>`;
    } finally {
        if (btn) { btn.innerHTML = originalBtnHtml; btn.disabled = false; }
    }
}

async function processSecurePayment() {
    const btn = document.getElementById('payNowBtn');
    const originalText = btn.innerHTML;
    const user = getSavedUser();
    const targetEmail = user ? user.email : 'guest@remalsim.com';

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-lg"></i> جاري معالجة الطلب...';
    btn.disabled = true;

    localStorage.setItem('pending_esim_package', JSON.stringify({
        ...currentSelectedPackage, walletDeducted: walletDeductionAED, paidAmount: finalPriceAED
    }));

    if (finalPriceAED <= 0) {
        user.walletBalance = Math.max(0, (user.walletBalance || 0) - walletDeductionAED);
        saveUserPersistent(user);
        setTimeout(() => { closeCheckoutModal(); window.location.href = `index.html?payment=success&ref=WAL-${Date.now()}`; }, 1000);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/checkout`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageId: currentSelectedPackage.id, price: finalPriceAED, walletDeducted: walletDeductionAED, customerEmail: targetEmail })
        });
        const data = await response.json();
        if (data.success && data.paymentUrl) {
            window.location.href = data.paymentUrl;
        } else {
            showToast(data.message || 'فشل في تهيئة الدفع', true);
            btn.innerHTML = originalText; btn.disabled = false;
        }
    } catch (error) {
        showToast('حدث خطأ في الاتصال بالخادم.', true);
        btn.innerHTML = originalText; btn.disabled = false;
    }
}

async function processTopupPayment() {
    const btn = document.getElementById('confirmTopupBtn');
    const selectedOption = document.querySelector('input[name="topupOption"]:checked').value;
    const [gb, price] = selectedOption.split('|');
    const user = getSavedUser();
    const targetEmail = user ? user.email : 'guest@remalsim.com';

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري فتح بوابة الدفع...';
    btn.disabled = true;

    try {
        localStorage.setItem('pending_topup_order', JSON.stringify({ iccid: currentTopupIccid, gb: parseInt(gb), price: parseFloat(price) }));
        const response = await fetch(`${API_URL}/api/checkout`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageId: `topup_${currentTopupIccid}_${gb}gb`, price: parseFloat(price), customerEmail: targetEmail })
        });
        const data = await response.json();
        if (data.success && data.paymentUrl) {
            window.location.href = data.paymentUrl;
        } else {
            showToast(data.message || 'تعذر بدء عملية الدفع', true);
            btn.innerHTML = 'الانتقال للدفع الآمن <i class="fa-solid fa-lock"></i>'; btn.disabled = false;
        }
    } catch (err) {
        showToast('خطأ في الاتصال بالخادم', true);
        btn.innerHTML = 'الانتقال للدفع الآمن <i class="fa-solid fa-lock"></i>'; btn.disabled = false;
    }
}

async function verifyPaymentAndFulfill() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const referenceId = urlParams.get('ref');

    if (paymentStatus === 'success' && referenceId) {
        switchView('dashboardView');
        const pendingTopupStr = localStorage.getItem('pending_topup_order');
        if (pendingTopupStr) {
            const topupData = JSON.parse(pendingTopupStr);
            let esims = JSON.parse(localStorage.getItem('rimal_my_esims')) || [];
            const index = esims.findIndex(e => e.iccid === topupData.iccid);
            if (index > -1) {
                esims[index].totalBytes += topupData.gb * 1024;
                localStorage.setItem('rimal_my_esims', JSON.stringify(esims));
            }
            localStorage.removeItem('pending_topup_order');
            showToast(`🎉 تم شحن ${topupData.gb}GB بنجاح للشريحة!`);
            renderMyEsims();
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        showToast('✅ تم استلام الدفع! جاري استخراج الشريحة...');
        try {
            let data = { success: true, iccid: `890000${Date.now().toString().slice(-9)}`, qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LPA:1$remalsim.com$TEST' };
            if (!referenceId.startsWith('WAL-')) {
                const res = await fetch(`${API_URL}/api/fulfill-esim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referenceId }) });
                data = await res.json();
            }
            
            if (data.success) {
                const pendingPkgStr = localStorage.getItem('pending_esim_package');
                const pendingPkg = pendingPkgStr ? JSON.parse(pendingPkgStr) : { country: 'الإمارات', flag: '🇦🇪', data: '3 GB', price: '35.00' };
                saveEsimLocally({
                    ...pendingPkg, iccid: data.iccid, qrUrl: data.qr_code_url, lpa: data.lpa || `LPA:1$smdp.io$${data.iccid}`,
                    date: new Date().toISOString().split('T')[0], totalBytes: (parseInt(pendingPkg.data) || 3) * 1024, usedBytes: 0 
                });

                const user = getSavedUser();
                if (user) {
                    const purchasesCount = parseInt(user.purchasesCount || 0);
                    const tier = getTierInfo(purchasesCount);
                    const actualPaid = parseFloat(pendingPkg.paidAmount !== undefined ? pendingPkg.paidAmount : pendingPkg.price);
                    const earnedCashback = parseFloat((actualPaid * tier.rate).toFixed(2));
                    let newBalance = parseFloat(user.walletBalance || 0);
                    if (pendingPkg.walletDeducted) newBalance = Math.max(0, newBalance - parseFloat(pendingPkg.walletDeducted));
                    user.walletBalance = newBalance + earnedCashback;
                    user.purchasesCount = purchasesCount + 1;
                    saveUserPersistent(user);
                    updateAuthUI(); updateDashboardVIP();
                    if (earnedCashback > 0) showToast(`🎉 مبروك! حصلت على كاش باك ${earnedCashback} AED من مشترياتك!`);
                    else showToast('🎉 تمت إضافة الشريحة لمحفظتك بنجاح!');
                }
                renderMyEsims();
            } else showToast(data.message || 'حدث خطأ أثناء استخراج الشريحة', true);
        } catch (err) { showToast('خطأ في الاتصال أثناء استلام الشريحة', true);
        } finally { window.history.replaceState({}, document.title, window.location.pathname); localStorage.removeItem('pending_esim_package'); }
    } else if (paymentStatus === 'failed') {
        showToast('❌ تم إلغاء أو تعذر إتمام عملية الدفع.', true);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

async function fetchInstructions(iccid) {
    const modal = document.getElementById('instructionsModal');
    const content = document.getElementById('instructionsContent');
    const body = document.getElementById('instructionsBody');
    
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-y-10'); }, 10);
    
    body.innerHTML = `<div class="flex flex-col items-center justify-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan mb-3"></div><p class="text-xs text-slate-400">جاري جلب إرشادات التثبيت...</p></div>`;

    try {
        const res = await fetch(`${API_URL}/api/airalo/instructions/${iccid}?lang=ar`);
        const data = await res.json();

        if (data.success && data.instructions) {
            let html = ''; const inst = data.instructions;
            if (inst.ios && inst.ios.length > 0) {
                html += `<div class="mb-4"><h4 class="text-brand-cyan font-bold mb-2">🍎 إرشادات أجهزة أبل (iOS):</h4>`;
                inst.ios.forEach((item) => {
                    if (item.installation_manual && item.installation_manual.steps) {
                        html += `<div class="bg-black/30 p-3 rounded-xl mb-2 text-xs">`;
                        Object.values(item.installation_manual.steps).forEach((stepText, sIdx) => { html += `<p class="mb-1 text-slate-300"><strong>خطوة ${sIdx + 1}:</strong> ${stepText}</p>`; });
                        html += `</div>`;
                    }
                });
                html += `</div>`;
            }
            if (inst.android && inst.android.length > 0) {
                html += `<div><h4 class="text-emerald-400 font-bold mb-2">🤖 إرشادات أجهزة أندرويد (Android):</h4>`;
                inst.android.forEach((item) => {
                    if (item.installation_manual && item.installation_manual.steps) {
                        html += `<div class="bg-black/30 p-3 rounded-xl mb-2 text-xs">`;
                        Object.values(item.installation_manual.steps).forEach((stepText, sIdx) => { html += `<p class="mb-1 text-slate-300"><strong>خطوة ${sIdx + 1}:</strong> ${stepText}</p>`; });
                        html += `</div>`;
                    }
                });
                html += `</div>`;
            }
            body.innerHTML = html || '<p class="text-center text-slate-400">لا توجد إرشادات تفصيلية متاحة لهذه الشريحة حالياً.</p>';
        } else body.innerHTML = '<p class="text-center text-rose-400">تعذر تحميل الإرشادات في الوقت الحالي.</p>';
    } catch (err) { body.innerHTML = '<p class="text-center text-rose-400">حدث خطأ في الاتصال بالخادم.</p>'; }
}
