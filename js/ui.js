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
