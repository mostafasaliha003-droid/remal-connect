// ==========================================
// 🚀 التفاعل المركزي والمحرك الرئيسي (Main Controller)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. تأثير الـ 3D التفاعلي للهاتف (Glassmorphism Mockup)
    const container = document.querySelector('.perspective-container');
    const phone = document.getElementById('phoneMockup');
    
    if (container && phone) {
        container.addEventListener('mousemove', (e) => {
            // إيقاف التأثير التفاعلي على شاشات الموبايل لتجربة مستخدم أفضل
            if (window.innerWidth < 1024) return; 
            
            const rect = container.getBoundingClientRect();
            const rotateX = (((e.clientY - rect.top) - rect.height / 2) / (rect.height / 2)) * -12;
            const rotateY = (((e.clientX - rect.left) - rect.width / 2) / (rect.width / 2)) * 12;
            
            phone.style.transition = 'transform 0.1s ease-out';
            phone.style.transform = `scale(1) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        container.addEventListener('mouseleave', () => { 
            // عودة الهاتف لوضعه الطبيعي بسلاسة
            phone.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            phone.style.transform = `scale(1) rotateX(0deg) rotateY(0deg)`; 
        });
    }
    
    // 2. 🛡️ تهيئة الواجهة بنظام الحماية من الانهيار (Crash Protection)
    try { 
        if (typeof updateAuthUI === 'function') updateAuthUI(); 
    } catch (e) { 
        console.error('⚠️ خطأ في واجهة المستخدم:', e); 
    }
    
    try { 
        if (typeof fetchPackages === 'function') fetchPackages(); 
    } catch (e) { 
        console.error('⚠️ خطأ في جلب الباقات:', e); 
    }
    
    // 3. التقاط استجابة بوابة الدفع (Ziina)
    try { 
        if (typeof verifyPaymentAndFulfill === 'function') verifyPaymentAndFulfill(); 
    } catch (e) { 
        console.error('⚠️ خطأ في التحقق من الدفع:', e); 
    }

    // 4. تشغيل محرك البحث الذكي للوجهات
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput && typeof fetchPackages === 'function') {
                try {
                    fetchPackages(searchInput.value.trim());
                    // التمرير السلس لقسم النتائج
                    const packagesSection = document.getElementById('packagesSection');
                    if (packagesSection) packagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } catch(err) {
                    console.error('⚠️ خطأ أثناء البحث:', err);
                }
            }
        });
    }
});

// ==========================================
// 🚀 تسجيل تطبيق الويب التقدمي (PWA Service Worker)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { 
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ [PWA] Service Worker is active and running.');
            })
            .catch(err => {
                console.error('❌ [PWA] Service Worker registration failed:', err);
            }); 
    });
}
