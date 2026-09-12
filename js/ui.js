function getTierInfo(purchasesCount) {
    const count = parseInt(purchasesCount) || 0;
    if (count <= 4) return { name: "الدرع الفضي", key: "silver", rate: 0.01, rateText: "كاش باك 1%", tagClass: "bg-slate-500/20 text-slate-300 border-slate-500/30", borderClass: "border-slate-400", glowColor: "bg-slate-400", progressGrad: "bg-gradient-to-l from-slate-200 to-slate-400", nextTier: "الدرع الذهبي (5 مشتريات)", progress: Math.min((count / 4) * 100, 100), desc: count === 0 ? "أكمل أول عملية شراء للبدء في حصد الكاش باك!" : `أكملت ${count} من 4 طلبات للوصول للدرع الذهبي!` };
    else if (count <= 10) return { name: "الدرع الذهبي", key: "gold", rate: 0.015, rateText: "كاش باك 1.5%", tagClass: "bg-amber-500/20 text-amber-300 border-amber-500/30", borderClass: "border-amber-400", glowColor: "bg-amber-400", progressGrad: "bg-gradient-to-l from-amber-300 to-amber-500", nextTier: "الدرع البلاتيني (11 شراء)", progress: Math.min(((count - 4) / 6) * 100, 100), desc: `أكملت ${count} طلبات! يتبقى ${11 - count} طلبات للترقية للدرع البلاتيني.` };
    else if (count <= 20) return { name: "الدرع البلاتيني", key: "platinum", rate: 0.02, rateText: "كاش باك 2%", tagClass: "bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/30", borderClass: "border-[#06b6d4]", glowColor: "bg-[#06b6d4]", progressGrad: "bg-gradient-to-l from-cyan-300 to-[#06b6d4]", nextTier: "الدرع الماسي VIP (21 شراء)", progress: Math.min(((count - 10) / 10) * 100, 100), desc: `رائع! ${count} طلبات مكتملة. يتبقى ${21 - count} طلبات لأعلى تصنيف!` };
    else return { name: "الدرع الماسي VIP", key: "diamond", rate: 0.03, rateText: "كاش باك 3%", tagClass: "bg-purple-500/20 text-purple-300 border-purple-500/30", borderClass: "border-purple-400", glowColor: "bg-purple-400", progressGrad: "bg-gradient-to-l from-purple-300 to-purple-500", nextTier: "أعلى مستوى نخبوي", progress: 100, desc: "أنت في أعلى تصنيف نخبوي! تتمتع بأقصى نسبة كاش باك 3% على كل طلب." };
}

function getSavedUser() {
    let data = localStorage.getItem('rimal_current_user');
    if (!data) {
        const match = document.cookie.match(new RegExp('(^| )rimal_current_user=([^;]+)'));
        if (match) { try { data = decodeURIComponent(match[2]); localStorage.setItem('rimal_current_user', data); } catch(e) {} }
    }
    try { return data ? JSON.parse(data) : null; } catch (e) { return null; }
}

function saveUserPersistent(userObj) {
    const str = JSON.stringify(userObj);
    localStorage.setItem('rimal_current_user', str);
    document.cookie = `rimal_current_user=${encodeURIComponent(str)}; path=/; max-age=31536000; SameSite=Lax`;
}

function logoutUser(e) {
    if(e) e.stopPropagation();
    localStorage.removeItem('rimal_current_user');
    document.cookie = "rimal_current_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    showToast('تم تسجيل الخروج بنجاح 👋');
    setTimeout(() => { window.location.reload(); }, 600);
}

function handleMobileAccountNav(e) {
    if (e) e.preventDefault();
    const user = getSavedUser();
    if (user) { switchView('dashboardView'); } else { window.location.href = 'register.html'; }
}

function convertCurrency() {
    const selector = document.getElementById('currencySelector');
    if (selector) currentCurrency = selector.value;
    document.querySelectorAll('.price-val').forEach(el => {
        const baseAED = parseFloat(el.getAttribute('data-aed'));
        if (baseAED) {
            const converted = (baseAED * exchangeRates[currentCurrency]).toFixed(2);
            el.innerHTML = `${converted} <span class="text-[10px] text-brand-cyan">${currentCurrency}</span>`;
        }
    });
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toastMsg'), icon = document.getElementById('toastIcon');
    if (!toast || !icon) return;
    document.getElementById('toastText').innerText = message;
    icon.className = isError ? 'fa-solid fa-circle-xmark text-rose-500 text-xl' : 'fa-solid fa-circle-check text-brand-cyan text-xl';
    toast.classList.remove('opacity-0', '-translate-y-32');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => { toast.classList.add('opacity-0', '-translate-y-32'); toast.classList.remove('opacity-100', 'translate-y-0'); }, 3500);
}

function updateAuthUI() {
    const authArea = document.getElementById('headerAuthArea');
    const user = getSavedUser();
    const mobileLabel = document.getElementById('mobileAccountLabel');
    if (mobileLabel) mobileLabel.innerText = user ? (user.fullName ? user.fullName.split(' ')[0] : 'لوحتي') : 'حسابي';

    if (user && authArea) {
        saveUserPersistent(user);
        const initialLetter = user.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'U';
        const firstName = user.fullName ? user.fullName.split(' ')[0] : 'حسابي';
        const walletBalance = parseFloat(user.walletBalance || 0).toFixed(2);
        
        authArea.innerHTML = `<select aria-label="اختيار العملة" id="currencySelector" onchange="convertCurrency()" class="hidden md:block bg-black/40 border border-white/5 text-slate-300 hover:text-white text-xs font-bold py-2 px-3 rounded-2xl outline-none cursor-pointer transition-colors appearance-none text-center backdrop-blur-md"><option value="AED" class="bg-slate-900 text-white">AED</option><option value="SAR" class="bg-slate-900 text-white">SAR</option><option value="USD" class="bg-slate-900 text-white">USD</option><option value="EUR" class="bg-slate-900 text-white">EUR</option></select><button onclick="switchView('dashboardView')" class="flex items-center gap-3 hover:bg-white/5 px-3 py-1.5 rounded-2xl transition-colors text-left cursor-pointer border border-transparent"><div class="flex flex-col items-end"><span class="text-[9px] font-black text-emerald-400 tracking-wider">محفظتي: ${walletBalance} AED</span><span class="text-xs font-bold text-white">${firstName}</span></div><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-[#06b6d4] to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">${initialLetter}</div></button><button onclick="logoutUser(event)" title="تسجيل الخروج" aria-label="تسجيل الخروج" class="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition cursor-pointer ml-1"><i class="fa-solid fa-arrow-right-from-bracket text-xs"></i></button>`;
        if(document.getElementById('currencySelector')) document.getElementById('currencySelector').value = currentCurrency;
    }
}

function switchView(viewId) {
    const home = document.getElementById('homeView'), dash = document.getElementById('dashboardView');
    if (viewId === 'dashboardView') { home.classList.add('hidden'); home.classList.remove('block'); dash.classList.remove('hidden'); dash.classList.add('block'); updateDashboardVIP(); renderMyEsims();
    } else { dash.classList.add('hidden'); dash.classList.remove('block'); home.classList.remove('hidden'); home.classList.add('block'); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateDashboardVIP() {
    const user = getSavedUser();
    if (!user) return;
    const purchasesCount = parseInt(user.purchasesCount) || 0;
    const walletBalance = parseFloat(user.walletBalance || 0).toFixed(2);
    const tier = getTierInfo(purchasesCount);

    const container = document.getElementById('tierBannerContainer');
    if (container) container.className = `glass-pill p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t-[3px] ${tier.borderClass} rounded-3xl relative overflow-hidden`;
    const badge = document.getElementById('tierShieldBadge');
    if (badge) badge.innerHTML = SHIELD_SVGS[tier.key];
    const glow = document.getElementById('tierGlow');
    if (glow) glow.className = `glow-overlay top-0 right-0 ${tier.glowColor}`;
    const tag = document.getElementById('userTierTag');
    if (tag) { tag.innerText = tier.name; tag.className = `text-[10px] md:text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded-md border ${tier.tagClass}`; }
    const rateBadge = document.getElementById('cashbackRateBadge');
    if (rateBadge) rateBadge.innerText = tier.rateText;
    const walletText = document.getElementById('userWalletText');
    if (walletText) walletText.innerHTML = `<i class="fa-solid fa-wallet text-xs"></i> ${walletBalance} AED`;
    const currentLevel = document.getElementById('currentLevelName');
    if (currentLevel) currentLevel.innerText = `${tier.name} (${purchasesCount} طلبات)`;
    const nextLevel = document.getElementById('nextTierName');
    if (nextLevel) nextLevel.innerText = tier.nextTier;
    const bar = document.getElementById('tierProgressBar');
    if (bar) { bar.className = `h-2.5 rounded-full transition-all duration-1000 ${tier.progressGrad}`; setTimeout(() => { bar.style.width = `${tier.progress}%`; }, 200); }
    const desc = document.getElementById('tierProgressDesc');
    if (desc) desc.innerText = tier.desc;
    const refCodeEl = document.getElementById('referralCode');
    if (refCodeEl) {
        if (!user.referralCode) {
            const cleanName = user.fullName ? user.fullName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) : 'RML';
            user.referralCode = (cleanName.length >= 2 ? cleanName : 'RML') + Math.floor(1000 + Math.random() * 9000); saveUserPersistent(user);
        }
        refCodeEl.innerText = user.referralCode;
    }
}

function copyReferralCode() {
    const code = document.getElementById('referralCode').innerText;
    if (!code || code === '--') return;
    navigator.clipboard.writeText(code).then(() => {
        const icon = document.getElementById('copyRefIcon');
        if (icon) { icon.className = 'fa-solid fa-check text-slate-950 text-xl'; setTimeout(() => { icon.className = 'fa-regular fa-copy'; }, 2000); }
        showToast(`تم نسخ كود المشاركة الخاص بك: ${code} 📋`);
    });
}

function quickSearch(country) { document.getElementById('searchInput').value = country; fetchPackages(country); document.getElementById('packagesSection').scrollIntoView({ behavior: 'smooth' }); }

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
            <div class="flex items-center justify-between border-t border-white/10 pt-4 relative z-10"><div class="text-right"><span class="block text-[9px] font-bold text-slate-400 mb-0.5">السعر الشامل</span><div class="flex items-baseline gap-1" dir="ltr"><span class="font-black text-2xl text-white price-val drop-shadow-md" data-aed="${pkg.price}">${pkg.price}</span><span class="text-[10px] font-black text-brand-cyan">AED</span></div></div><button aria-label="شراء الباقة" onclick="openCheckoutModalByIndex(${index})" class="masterstroke-btn text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border-none shadow-[0_0_20px_rgba(6,182,216,0.35)]">شراء وتفعيل <i class="fa-solid fa-arrow-right text-[10px]"></i></button></div>
        </div>`;
    });
    container.innerHTML = html; convertCurrency(); 
}

function openCheckoutModalByIndex(index) {
    const pkg = window.allPackages[index];
    if (!pkg) return;
    currentSelectedPackage = pkg; originalPriceAED = parseFloat(pkg.price); finalPriceAED = originalPriceAED; walletDeductionAED = 0;
    document.getElementById('modalCountry').innerText = `${pkg.country} ${pkg.flag}`; document.getElementById('modalData').innerText = pkg.data; document.getElementById('modalOriginalPrice').innerText = originalPriceAED.toFixed(2); document.getElementById('modalFinalPrice').innerText = finalPriceAED.toFixed(2);

    const user = getSavedUser(), actionArea = document.getElementById('checkoutActionArea'), walletArea = document.getElementById('walletDeductionArea'), walletCheckbox = document.getElementById('useWalletCheckbox');
    if (user) {
        const userBalance = parseFloat(user.walletBalance || 0);
        if (userBalance > 0) { walletArea.classList.remove('hidden'); document.getElementById('availableWalletLabel').innerText = `الرصيد المتاح: ${userBalance.toFixed(2)} AED`; walletCheckbox.checked = false; document.getElementById('deductedAmountLabel').innerText = '-0.00 AED'; } else { walletArea.classList.add('hidden'); }
        updateCheckoutButtonUI(finalPriceAED);
    } else {
        walletArea.classList.add('hidden'); actionArea.innerHTML = `<div class="text-center mb-4"><span class="text-xs font-bold text-slate-400">يجب تسجيل الدخول لإتمام الشراء والاستفادة من الكاش باك</span></div><a href="register.html" class="w-full masterstroke-btn text-white font-black py-4 rounded-xl shadow-[0_0_15px_rgba(6,182,216,0.3)] transition-transform active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer text-sm decoration-none">تسجيل الدخول / حساب جديد <i class="fa-regular fa-user"></i></a>`;
    }
    const modal = document.getElementById('checkoutModal'), content = document.getElementById('checkoutContent');
    modal.classList.remove('hidden'); setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-y-10'); }, 10);
}

function toggleWalletDiscount() {
    const user = getSavedUser(), checkbox = document.getElementById('useWalletCheckbox'), userBalance = user ? parseFloat(user.walletBalance || 0) : 0;
    if (checkbox.checked) { walletDeductionAED = Math.min(userBalance, originalPriceAED); finalPriceAED = Math.max(0, originalPriceAED - walletDeductionAED); document.getElementById('deductedAmountLabel').innerText = `-${walletDeductionAED.toFixed(2)} AED`; } else { walletDeductionAED = 0; finalPriceAED = originalPriceAED; document.getElementById('deductedAmountLabel').innerText = '-0.00 AED'; }
    document.getElementById('modalFinalPrice').innerText = finalPriceAED.toFixed(2); updateCheckoutButtonUI(finalPriceAED);
}

function updateCheckoutButtonUI(finalAmount) {
    const actionArea = document.getElementById('checkoutActionArea');
    if (finalAmount <= 0) { actionArea.innerHTML = `<div class="flex items-center justify-center gap-2 mb-3 text-[11px] text-emerald-400 font-black bg-emerald-950/40 py-2 rounded-xl border border-emerald-500/30"><i class="fa-solid fa-circle-check"></i> رصيد الكاش باك يغطي كامل قيمة الباقة!</div><button id="payNowBtn" aria-label="شراء من المحفظة" onclick="processSecurePayment()" class="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-transform active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer text-sm">إتمام الشراء مجاناً من المحفظة <i class="fa-solid fa-arrow-left"></i></button>`; } 
    else { actionArea.innerHTML = `<div class="flex items-center justify-center gap-2 mb-3 text-[10px] text-emerald-400 font-bold bg-emerald-900/30 py-2 rounded-xl border border-emerald-500/30"><i class="fa-solid fa-lock"></i> دفع إلكتروني آمن عبر Ziina</div><button id="payNowBtn" aria-label="الدفع" onclick="processSecurePayment()" class="w-full masterstroke-btn text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,216,0.3)] transition-transform active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer text-sm">دفع ${finalAmount.toFixed(2)} AED الآن <i class="fa-solid fa-arrow-left"></i></button>`; }
}

function closeCheckoutModal() { const modal = document.getElementById('checkoutModal'), content = document.getElementById('checkoutContent'); modal.classList.add('opacity-0'); content.classList.add('translate-y-10'); setTimeout(() => { modal.classList.add('hidden'); }, 300); }
function openTopupModal(iccid) { currentTopupIccid = iccid; document.getElementById('topupIccid').innerText = iccid; const modal = document.getElementById('topupModal'), content = document.getElementById('topupContent'); modal.classList.remove('hidden'); setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-y-10'); }, 10); }
function closeTopupModal() { const modal = document.getElementById('topupModal'), content = document.getElementById('topupContent'); modal.classList.add('opacity-0'); content.classList.add('translate-y-10'); setTimeout(() => { modal.classList.add('hidden'); }, 300); }
function closeInstructionsModal() { const modal = document.getElementById('instructionsModal'), content = document.getElementById('instructionsContent'); modal.classList.add('opacity-0'); content.classList.add('translate-y-10'); setTimeout(() => { modal.classList.add('hidden'); }, 300); }
function copyToClipboard(text, btnElement) { navigator.clipboard.writeText(text).then(() => { showToast('تم نسخ رمز التثبيت بنجاح!'); }); }
function saveEsimLocally(esimData) { let esims = JSON.parse(localStorage.getItem('rimal_my_esims')) || []; esims.unshift(esimData); localStorage.setItem('rimal_my_esims', JSON.stringify(esims)); }
function openCompatibilityModal() { document.getElementById('compatibilityModal').classList.remove('hidden'); setTimeout(() => { document.getElementById('compatibilityModal').classList.remove('opacity-0'); document.getElementById('compatibilityContent').classList.remove('translate-y-10'); }, 10); }
function closeCompatibilityModal() { document.getElementById('compatibilityModal').classList.add('opacity-0'); document.getElementById('compatibilityContent').classList.add('translate-y-10'); setTimeout(() => { document.getElementById('compatibilityModal').classList.add('hidden'); document.getElementById('deviceResult').classList.add('hidden'); }, 300); }
function checkDeviceCompatibility(e) { e.preventDefault(); const device = document.getElementById('deviceInput').value.toLowerCase(); const resultDiv = document.getElementById('deviceResult'); resultDiv.classList.remove('hidden'); if(device.length > 2) { resultDiv.innerHTML = `<div class="bg-emerald-900/30 border border-emerald-500/50 p-4 rounded-xl flex items-start gap-4 mt-2"><i class="fa-solid fa-circle-check text-emerald-400 mt-1 text-2xl"></i><div class="text-right"><h4 class="text-emerald-300 font-black text-sm mb-1.5">ممتاز! جهازك مدعوم</h4><p class="text-emerald-100/70 text-[11px] font-bold leading-relaxed">هذا الجهاز متوافق مع شريحة eSIM الإلكترونية.</p></div></div>`; } }

function installSmartEsim(lpaString) {
    if (!lpaString) { showToast('رمز LPA غير متوفر', true); return; } navigator.clipboard.writeText(lpaString).catch(() => {});
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) { showToast('جاري فتح معالج تثبيت الشريحة في الآيفون...'); window.location.href = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpaString)}`; } 
    else { showToast('تم نسخ رمز LPA! انتقل إلى الإعدادات لإضافة eSIM'); alert("لتثبيت الشريحة على أندرويد:\n1. تم نسخ رمز التفعيل (LPA) تلقائياً.\n2. اذهب إلى: الضبط > الاتصالات > إدارة بطاقة SIM > إضافة eSIM.\n3. اختر 'إدخال رمز التفعيل يدوياً' والصق الرمز."); }
}

function downloadQrCode(qrUrl, countryName) {
    if (!qrUrl) { showToast('رمز QR غير متوفر', true); return; } showToast('جاري فتح الصورة لحفظها في الصور...');
    const newTab = window.open(); newTab.document.write(`<html dir="rtl"><head><title>كود eSIM - ${countryName}</title></head><body style="background:#030712;color:white;text-align:center;font-family:sans-serif;padding:30px;"><h2>رمز تفعيل شريحة ${countryName}</h2><p style="color:#06b6d4;">اضغط مطولاً على الصورة ثم اختر "حفظ في الصور" (Save Image)</p><img src="${qrUrl}" style="max-width:300px;border-radius:15px;background:white;padding:10px;margin-top:20px;" /></body></html>`);
}

function renderMyEsims() {
    const container = document.getElementById('myEsimsContainer');
    const esims = JSON.parse(localStorage.getItem('rimal_my_esims')) || [];
    if (esims.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-20 glass-card rounded-3xl border border-white/5"><div class="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-brand-cyan text-4xl shadow-inner border border-white/10"><i class="fa-solid fa-box-open"></i></div><p class="text-white font-black text-2xl mb-3">حقيبة السفر الرقمية فارغة حالياً</p><p class="text-slate-400 font-bold text-sm mb-8 max-w-md mx-auto">اشترِ باقتك الأولى وسنقوم بحفظها هنا للوصول السريع حتى في وضع الطيران!</p><button onclick="switchView('homeView')" class="masterstroke-btn text-white px-10 py-4 rounded-xl font-black text-sm transition-transform active:scale-95 border-none cursor-pointer shadow-[0_0_20px_rgba(6,182,216,0.3)]">تصفح الباقات العالمية</button></div>`; return;
    }
    let html = '';
    esims.forEach((esim) => {
        const lpaString = esim.lpa || `LPA:1$smdp.io$${esim.iccid}`;
        let totalMB = esim.totalBytes || 3072, usedMB = esim.usedBytes || 0, percentage = (usedMB / totalMB) * 100;
        let progressColor = percentage > 85 ? 'from-rose-500 to-red-600' : 'from-[#06b6d4] to-emerald-400';
        html += `<div class="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-8 rounded-[2rem]"><div class="w-full md:w-3/5 flex flex-col justify-between relative z-10"><div><div class="flex justify-between items-start mb-6"><div><span class="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[9px] font-black tracking-wide mb-2">🟢 الشريحة فعالة</span><h3 class="text-3xl font-black text-white flex items-center gap-3 drop-shadow-md">${esim.country} <span class="text-3xl filter drop-shadow-lg">${esim.flag}</span></h3></div><div class="text-left bg-black/20 p-2 rounded-lg border border-white/5"><span class="block text-[9px] text-slate-400 font-bold mb-0.5">تاريخ الشراء</span><span class="block text-xs font-bold text-slate-200" dir="ltr">${esim.date}</span></div></div><div class="mb-6"><div class="flex justify-between text-xs font-bold mb-2"><span class="text-slate-300">الاستهلاك المباشر</span><span class="text-white bg-black/40 px-2.5 py-1 rounded-md border border-white/5" dir="ltr">${(usedMB/1024).toFixed(2)} GB / ${(totalMB/1024).toFixed(2)} GB</span></div><div class="w-full bg-[#050B14] rounded-full h-3 overflow-hidden border border-white/5 shadow-inner"><div class="bg-gradient-to-r ${progressColor} h-3 rounded-full progress-bar-fill shadow-[0_0_10px_rgba(6,182,216,0.6)]" style="width: 0%" data-width="${percentage}%"></div></div><div class="mt-4 flex flex-wrap gap-2.5"><button aria-label="شحن الرصيد" onclick="openTopupModal('${esim.iccid}')" class="bg-white hover:bg-slate-200 text-[#030712] px-5 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-2 shadow-md border-none"><i class="fa-solid fa-bolt text-brand-cyan"></i> شحن الرصيد</button><button aria-label="إرشادات التثبيت" onclick="fetchInstructions('${esim.iccid}')" class="bg-white/5 hover:bg-white/10 text-brand-cyan border border-brand-cyan/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"><i class="fa-solid fa-book-open"></i> إرشادات التثبيت</button></div></div><div class="flex flex-wrap gap-3"><div class="bg-black/30 border border-white/5 p-3 rounded-xl flex-1 min-w-[120px]"><span class="block text-[9px] text-slate-400 font-bold mb-1"><i class="fa-solid fa-sim-card text-brand-cyan ml-1"></i>رقم الشريحة (ICCID)</span><span class="block font-black text-xs text-white tracking-widest truncate" dir="ltr">${esim.iccid}</span></div><div class="bg-black/30 border border-white/5 p-3 rounded-xl flex-1 min-w-[100px]"><span class="block text-[9px] text-slate-400 font-bold mb-1"><i class="fa-solid fa-clock text-brand-cyan ml-1"></i>الصلاحية المتبقية</span><span class="block font-black text-sm text-emerald-400">14 يوماً</span></div></div></div></div><div class="w-full md:w-2/5 flex flex-col items-center justify-center border-t md:border-t-0 md:border-r border-white/5 pt-6 md:pt-0 md:pr-6 relative"><div class="qr-frame mb-4 w-44 h-44 z-10"><img src="${esim.qrUrl}" alt="QR Code" class="w-full h-full object-cover rounded-xl" /></div><button aria-label="تثبيت ذكي" onclick="installSmartEsim('${lpaString}')" class="w-full masterstroke-btn text-white py-3 rounded-xl font-black text-xs shadow-[0_0_15px_rgba(6,182,216,0.3)] flex items-center justify-center gap-2 border-none cursor-pointer transition-colors relative z-10 mb-2.5"><i class="fa-solid fa-mobile-button text-sm"></i> تثبيت تلقائي (ذكي)</button><button aria-label="تحميل QR" onclick="downloadQrCode('${esim.qrUrl}', '${esim.country}')" class="w-full bg-black hover:bg-[#0A101C] text-white py-2.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-colors relative z-10 mb-4 shadow-sm"><i class="fa-solid fa-download text-brand-cyan"></i> حفظ رمز QR في الصور</button><div class="w-full bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 text-right"><p class="text-[9px] text-amber-400 font-bold mb-1.5 flex items-center gap-1"><i class="fa-solid fa-circle-info"></i> رمز التثبيت اليدوي (LPA):</p><div class="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-amber-500/20 cursor-pointer hover:border-amber-400 transition-colors" onclick="copyToClipboard('${lpaString}', this)"><span class="text-[9px] font-black text-slate-300 truncate mr-1 flex-1" dir="ltr">${lpaString}</span><button aria-label="نسخ رمز التثبيت" class="bg-amber-500 text-slate-900 w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer pointer-events-none shrink-0"><i class="fa-regular fa-copy text-[10px]"></i></button></div></div></div></div>`;
    });
    container.innerHTML = html; setTimeout(() => { document.querySelectorAll('.progress-bar-fill').forEach(bar => { bar.style.width = bar.getAttribute('data-width'); }); }, 100);
}
