// ==========================================
// 🚀 تحديث واجهة المستخدم والهوية البصرية (UI Controller)
// ==========================================

function getTierInfo(purchasesCount) {
    const count = parseInt(purchasesCount) || 0;
    if (count <= 4) return { 
        name: "الدرع الفضي", key: "silver", rate: 0.01, rateText: "كاش باك 1%", 
        tagClass: "bg-slate-500/20 text-slate-300 border-slate-500/30 shadow-[0_0_10px_rgba(100,116,139,0.3)]", 
        borderClass: "border-slate-400", glowColor: "bg-slate-400", 
        progressGrad: "bg-gradient-to-l from-slate-200 to-slate-400 shadow-[0_0_8px_rgba(100,116,139,0.5)]", 
        nextTier: "الدرع الذهبي (5 مشتريات)", progress: Math.min((count / 4) * 100, 100), 
        desc: count === 0 ? "أكمل أول عملية شراء للبدء في حصد الكاش باك!" : `أكملت ${count} من 4 طلبات للوصول للدرع الذهبي!` 
    };
    else if (count <= 10) return { 
        name: "الدرع الذهبي", key: "gold", rate: 0.015, rateText: "كاش باك 1.5%", 
        tagClass: "bg-[#00b4d8]/20 text-[#00b4d8] border-[#00b4d8]/30 shadow-[0_0_10px_rgba(0,180,216,0.3)]", 
        borderClass: "border-[#00b4d8]", glowColor: "bg-[#00b4d8]", 
        progressGrad: "bg-gradient-to-l from-[#48cae4] to-[#00b4d8] shadow-[0_0_8px_rgba(0,180,216,0.5)]", 
        nextTier: "الدرع البلاتيني (11 شراء)", progress: Math.min(((count - 4) / 6) * 100, 100), 
        desc: `أكملت ${count} طلبات! يتبقى ${11 - count} طلبات للترقية للدرع البلاتيني.` 
    };
    else if (count <= 20) return { 
        name: "الدرع البلاتيني", key: "platinum", rate: 0.02, rateText: "كاش باك 2%", 
        tagClass: "bg-[#023e8a]/40 text-[#00b4d8] border-[#00b4d8]/50 shadow-[0_0_10px_rgba(0,180,216,0.5)]", 
        borderClass: "border-[#0077b6]", glowColor: "bg-[#0077b6]", 
        progressGrad: "bg-gradient-to-l from-[#00b4d8] to-[#023e8a] shadow-[0_0_10px_rgba(2,62,138,0.5)]", 
        nextTier: "الدرع الماسي VIP (21 شراء)", progress: Math.min(((count - 10) / 10) * 100, 100), 
        desc: `رائع! ${count} طلبات مكتملة. يتبقى ${21 - count} طلبات لأعلى تصنيف!` 
    };
    else return { 
        name: "الدرع الماسي VIP", key: "diamond", rate: 0.03, rateText: "كاش باك 3%", 
        tagClass: "bg-[#800000]/30 text-[#ff4d4d] border-[#ff4d4d]/30 shadow-[0_0_15px_rgba(128,0,0,0.5)]", 
        borderClass: "border-[#800000]", glowColor: "bg-[#800000]", 
        progressGrad: "bg-gradient-to-l from-[#ff4d4d] to-[#800000] shadow-[0_0_15px_rgba(128,0,0,0.8)]", 
        nextTier: "أعلى مستوى نخبوي", progress: 100, 
        desc: "أنت في أعلى تصنيف نخبوي! تتمتع بأقصى نسبة كاش باك 3% على كل طلب." 
    };
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
    if (selector && typeof currentCurrency !== 'undefined') currentCurrency = selector.value;
    document.querySelectorAll('.price-val').forEach(el => {
        const baseAED = parseFloat(el.getAttribute('data-aed'));
        if (baseAED && typeof exchangeRates !== 'undefined') {
            const converted = (baseAED * exchangeRates[currentCurrency]).toFixed(2);
            el.innerHTML = `${converted} <span class="text-[10px] text-[#00b4d8] drop-shadow-md">${currentCurrency}</span>`;
        }
    });
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toastMsg'), icon = document.getElementById('toastIcon');
    if (!toast || !icon) return;
    document.getElementById('toastText').innerText = message;
    
    // تطبيق ألوان الهوية على التنبيهات
    icon.className = isError ? 'fa-solid fa-circle-xmark text-[#ff4d4d] text-xl drop-shadow-[0_0_8px_rgba(255,77,77,0.5)]' : 'fa-solid fa-circle-check text-[#00b4d8] text-xl drop-shadow-[0_0_8px_rgba(0,180,216,0.5)]';
    toast.className = isError ? 'fixed top-24 left-1/2 -translate-x-1/2 opacity-100 bg-[#800000]/90 text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_20px_50px_rgba(128,0,0,0.6)] border border-[#ff4d4d]/50 flex items-center gap-3 z-[10000] backdrop-blur-md transition-all duration-400 translate-y-0' : 'fixed top-24 left-1/2 -translate-x-1/2 opacity-100 bg-[#0c151c]/90 text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_20px_50px_rgba(0,180,216,0.4)] border border-[#00b4d8]/40 flex items-center gap-3 z-[10000] backdrop-blur-md transition-all duration-400 translate-y-0';
    
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
        
        authArea.innerHTML = `
            <select aria-label="اختيار العملة" id="currencySelector" onchange="convertCurrency()" class="hidden md:block bg-transparent border border-white/20 text-white hover:bg-white/10 text-xs font-bold py-2 px-3 rounded-2xl outline-none cursor-pointer transition-all appearance-none text-center backdrop-blur-md focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8]">
                <option value="AED" class="bg-[#0c151c] text-white">AED</option><option value="SAR" class="bg-[#0c151c] text-white">SAR</option><option value="USD" class="bg-[#0c151c] text-white">USD</option><option value="EUR" class="bg-[#0c151c] text-white">EUR</option>
            </select>
            <button onclick="switchView('dashboardView')" class="flex items-center gap-3 hover:bg-white/5 px-3 py-1.5 rounded-2xl transition-all text-left cursor-pointer border border-transparent hover:border-[#00b4d8]/30 group">
                <div class="flex flex-col items-end">
                    <span class="text-[10px] font-semibold text-[#00b4d8] tracking-wider group-hover:text-[#48cae4] transition-colors">محفظتي: ${walletBalance} AED</span>
                    <span class="text-sm font-black text-white group-hover:text-[#00b4d8] transition-colors">${firstName}</span>
                </div>
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00b4d8] to-[#023e8a] flex items-center justify-center text-white text-sm font-black shadow-[0_0_15px_rgba(0,180,216,0.5)] ring-2 ring-transparent group-hover:ring-[#00b4d8] transition-all">${initialLetter}</div>
            </button>
            <button onclick="logoutUser(event)" title="تسجيل الخروج" aria-label="تسجيل الخروج" class="w-9 h-9 rounded-full bg-[#800000]/20 hover:bg-[#800000] text-[#ff4d4d] hover:text-white border border-[#800000]/50 flex items-center justify-center transition-all cursor-pointer ml-1 shadow-sm">
                <i class="fa-solid fa-power-off text-xs"></i>
            </button>
        `;
        if(document.getElementById('currencySelector') && typeof currentCurrency !== 'undefined') document.getElementById('currencySelector').value = currentCurrency;
    }
}

function switchView(viewId) {
    const home = document.getElementById('homeView'), dash = document.getElementById('dashboardView');
    if (viewId === 'dashboardView') { 
        if(home) { home.classList.add('hidden'); home.classList.remove('block'); }
        if(dash) { dash.classList.remove('hidden'); dash.classList.add('block'); }
        updateDashboardVIP(); 
        if(typeof renderMyEsims === 'function') renderMyEsims();
    } else { 
        if(dash) { dash.classList.add('hidden'); dash.classList.remove('block'); }
        if(home) { home.classList.remove('hidden'); home.classList.add('block'); }
    }
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
    if (badge && typeof SHIELD_SVGS !== 'undefined') badge.innerHTML = SHIELD_SVGS[tier.key];
    const glow = document.getElementById('tierGlow');
    if (glow) glow.className = `absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 ${tier.glowColor}`;
    const tag = document.getElementById('userTierTag');
    if (tag) { tag.innerText = tier.name; tag.className = `text-[10px] md:text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded-md border ${tier.tagClass}`; }
    const rateBadge = document.getElementById('cashbackRateBadge');
    // لون الكاش باك الموحد
    if (rateBadge) rateBadge.className = `text-xs font-bold text-[#00b4d8] drop-shadow-md`;
    if (rateBadge) rateBadge.innerText = tier.rateText;
    const walletText = document.getElementById('userWalletText');
    if (walletText) walletText.innerHTML = `<i class="fa-solid fa-wallet text-xs"></i> ${walletBalance} AED`;
    const currentLevel = document.getElementById('currentLevelName');
    if (currentLevel) currentLevel.innerText = `${tier.name} (${purchasesCount} طلبات)`;
    const nextLevel = document.getElementById('nextTierName');
    if (nextLevel) nextLevel.className = `text-[#00b4d8]`;
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
        if (icon) { icon.className = 'fa-solid fa-check text-white text-xl'; setTimeout(() => { icon.className = 'fa-regular fa-copy'; }, 2000); }
        showToast(`تم نسخ كود المشاركة الخاص بك: ${code} 📋`);
    });
}

function toggleWalletDiscount() {
    const user = getSavedUser(), checkbox = document.getElementById('useWalletCheckbox'), userBalance = user ? parseFloat(user.walletBalance || 0) : 0;
    if (checkbox && checkbox.checked) { 
        walletDeductionAED = Math.min(userBalance, typeof originalPriceAED !== 'undefined' ? originalPriceAED : 0); 
        finalPriceAED = Math.max(0, (typeof originalPriceAED !== 'undefined' ? originalPriceAED : 0) - walletDeductionAED); 
        document.getElementById('deductedAmountLabel').innerText = `-${walletDeductionAED.toFixed(2)} AED`; 
    } else { 
        walletDeductionAED = 0; 
        finalPriceAED = typeof originalPriceAED !== 'undefined' ? originalPriceAED : 0; 
        if(document.getElementById('deductedAmountLabel')) document.getElementById('deductedAmountLabel').innerText = '-0.00 AED'; 
    }
    if(document.getElementById('modalFinalPrice')) document.getElementById('modalFinalPrice').innerText = finalPriceAED.toFixed(2); 
    updateCheckoutButtonUI(finalPriceAED);
}

function updateCheckoutButtonUI(finalAmount) {
    const actionArea = document.getElementById('checkoutActionArea');
    if(!actionArea) return;
    if (finalAmount <= 0) {
        actionArea.innerHTML = `
            <div class="flex items-center justify-center gap-2 mb-3 text-[11px] text-[#00b4d8] font-black bg-[#00b4d8]/10 py-2 rounded-xl border border-[#00b4d8]/30 shadow-inner">
                <i class="fa-solid fa-circle-check"></i> رصيد الكاش باك يغطي قيمة الباقة!
            </div>
            <button id="payNowBtn" onclick="processSecurePayment()" class="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(0,180,216,0.4)] transition-transform active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer text-sm">
                إتمام الشراء مجاناً <i class="fa-solid fa-bolt"></i>
            </button>`;
    } else {
        actionArea.innerHTML = `
            <div class="flex items-center justify-center gap-2 mb-3 text-[10px] text-[#00b4d8] font-bold bg-[#0c151c] py-2 rounded-xl border border-[#00b4d8]/20">
                <i class="fa-solid fa-lock text-[#00b4d8]"></i> دفع إلكتروني آمن عبر بوابة Ziina
            </div>
            <button id="payNowBtn" onclick="processSecurePayment()" class="w-full masterstroke-btn text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-transform active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer text-sm">
                دفع ${finalAmount.toFixed(2)} AED الآن <i class="fa-solid fa-credit-card"></i>
            </button>`;
    }
}

function closeCheckoutModal() { const m = document.getElementById('checkoutModal'), c = document.getElementById('checkoutContent'); if(m && c){ m.classList.add('opacity-0'); c.classList.add('translate-y-10'); setTimeout(() => m.classList.add('hidden'), 300); } }
function openTopupModal(iccid) { currentTopupIccid = iccid; if(document.getElementById('topupIccid')) document.getElementById('topupIccid').innerText = iccid; const m = document.getElementById('topupModal'), c = document.getElementById('topupContent'); if(m && c){ m.classList.remove('hidden'); setTimeout(() => { m.classList.remove('opacity-0'); c.classList.remove('translate-y-10'); }, 10); } }
function closeTopupModal() { const m = document.getElementById('topupModal'), c = document.getElementById('topupContent'); if(m && c){ m.classList.add('opacity-0'); c.classList.add('translate-y-10'); setTimeout(() => m.classList.add('hidden'), 300); } }
function openCompatibilityModal() { const m = document.getElementById('compatibilityModal'), c = document.getElementById('compatibilityContent'); if(m && c){ m.classList.remove('hidden'); setTimeout(() => { m.classList.remove('opacity-0'); c.classList.remove('translate-y-10'); }, 10); } }
function closeCompatibilityModal() { const m = document.getElementById('compatibilityModal'), c = document.getElementById('compatibilityContent'), res = document.getElementById('deviceResult'); if(m && c){ m.classList.add('opacity-0'); c.classList.add('translate-y-10'); setTimeout(() => { m.classList.add('hidden'); if(res) res.classList.add('hidden'); }, 300); } }
function closeInstructionsModal() { const m = document.getElementById('instructionsModal'), c = document.getElementById('instructionsContent'); if(m && c){ m.classList.add('opacity-0'); c.classList.add('translate-y-10'); setTimeout(() => m.classList.add('hidden'), 300); } }
function checkDeviceCompatibility(e) { e.preventDefault(); const res = document.getElementById('deviceResult'); if(res){ res.classList.remove('hidden'); if(document.getElementById('deviceInput').value.length > 2) res.innerHTML = `<div class="bg-[#00b4d8]/10 border border-[#00b4d8]/30 p-4 rounded-xl flex items-start gap-4 mt-2 backdrop-blur-md shadow-inner"><i class="fa-solid fa-circle-check text-[#00b4d8] mt-1 text-2xl"></i><div class="text-right"><h4 class="text-white font-black text-sm mb-1.5 drop-shadow-md">ممتاز! جهازك مدعوم</h4><p class="text-slate-300 text-[11px] font-bold leading-relaxed">هذا الجهاز متوافق تماماً مع شريحة eSIM الإلكترونية.</p></div></div>`; } }