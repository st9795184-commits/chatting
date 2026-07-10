// Smooth scroll for nav links
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Simple project link click alert (optional)
document.querySelectorAll('.project-link').forEach(link => {
    link.addEventListener('click', function(e) {
        // Just letting you know it's working
        console.log('Opening project: ' + this.textContent);
    });
});

// Add a small greeting in console
console.log('Hey! Thanks for checking out my portfolio ✌️');


