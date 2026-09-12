function showToast(message, isError = false) {
    const toast = document.getElementById('toastMsg');
    const icon = document.getElementById('toastIcon');
    if (!toast || !icon) return;

    document.getElementById('toastText').innerText = message;
    icon.className = isError ? 'fa-solid fa-circle-xmark text-brand-red text-xl' : 'fa-solid fa-circle-check text-brand-cyan text-xl';

    toast.classList.remove('opacity-0', '-translate-y-32');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-32');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3500);
}

function switchView(viewId) {
    const home = document.getElementById('homeView');
    const dash = document.getElementById('dashboardView');
    if (viewId === 'dashboardView') {
        home.classList.add('hidden'); home.classList.remove('block');
        dash.classList.remove('hidden'); dash.classList.add('block');
        if (typeof renderMyEsims === 'function') renderMyEsims();
    } else {
        dash.classList.add('hidden'); dash.classList.remove('block');
        home.classList.remove('hidden'); home.classList.add('block');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateAuthUI() {
    const authArea = document.getElementById('headerAuthArea');
    authArea.innerHTML = `
        <select id="currencySelector" onchange="convertCurrency()" class="hidden md:block bg-black/40 border border-white/5 text-slate-300 hover:text-white text-xs font-bold py-2 px-3 rounded-2xl outline-none cursor-pointer transition-colors appearance-none text-center backdrop-blur-md">
            <option value="AED" class="bg-slate-900 text-white">AED</option><option value="SAR" class="bg-slate-900 text-white">SAR</option><option value="USD" class="bg-slate-900 text-white">USD</option><option value="EUR" class="bg-slate-900 text-white">EUR</option>
        </select>
        <button onclick="switchView('dashboardView')" class="flex items-center gap-3 hover:bg-white/5 px-3 py-1.5 rounded-2xl transition-colors text-left cursor-pointer border border-transparent">
            <div class="flex flex-col items-end">
                <span class="text-[9px] font-black text-emerald-400 tracking-wider">محفظتي</span>
                <span class="text-xs font-bold text-white">حسابي</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00b4d8] to-blue-600 flex items-center justify-center text-white text-xs font-black">U</div>
        </button>
    `;
}

function convertCurrency() {
    const selector = document.getElementById('currencySelector');
    if (selector) currentCurrency = selector.value;
    
    const priceElements = document.querySelectorAll('.price-val');
    priceElements.forEach(el => {
        const baseAED = parseFloat(el.getAttribute('data-aed'));
        if (baseAED) {
            const converted = (baseAED * exchangeRates[currentCurrency]).toFixed(2);
            el.innerHTML = `${converted} <span class="text-[10px] text-brand-cyan">${currentCurrency}</span>`;
        }
    });
}
