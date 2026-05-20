// js/blog-search.js

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('blog-search');
    const blogSection = document.querySelector('.blog-section');

    if (searchInput && blogSection) {
        searchInput.addEventListener('keydown', function(event) {
            // Reagiert, wenn die Enter-Taste gedrückt wird
            if (event.key === 'Enter') {
                event.preventDefault(); // Verhindert das Neuladen der Seite
                
                // Scrollt elegant zur Blog-Sektion
                blogSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        });
    }
});