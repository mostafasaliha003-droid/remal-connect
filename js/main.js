document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.perspective-container'), phone = document.getElementById('phoneMockup');
    if (container && phone) {
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect(), rotateX = (((e.clientY - rect.top) - rect.height / 2) / (rect.height / 2)) * -15, rotateY = (((e.clientX - rect.left) - rect.width / 2) / (rect.width / 2)) * 15;
            phone.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        container.addEventListener('mouseleave', () => { phone.style.transform = `rotateX(0deg) rotateY(0deg)`; });
    }
    
    updateAuthUI();
    fetchPackages();
    verifyPaymentAndFulfill(); 

    const searchForm = document.getElementById('searchForm');
    if(searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            fetchPackages(document.getElementById('searchInput').value.trim());
            document.getElementById('packagesSection').scrollIntoView({ behavior: 'smooth' });
        });
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed: ', err)); });
}
