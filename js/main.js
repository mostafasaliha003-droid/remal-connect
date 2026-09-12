document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchPackages();
    
    const searchForm = document.getElementById('searchForm');
    if(searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            fetchPackages(document.getElementById('searchInput').value.trim());
            document.getElementById('packagesSection').scrollIntoView({ behavior: 'smooth' });
        });
    }
});
