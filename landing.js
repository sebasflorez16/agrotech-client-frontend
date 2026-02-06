// AgroTech Digital - Landing Page JavaScript
// Animaciones y efectos interactivos

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            navbar.style.background = 'rgba(0, 0, 0, 0.9)';
            navbar.style.backdropFilter = 'saturate(180%) blur(20px)';
            navbar.style.borderBottom = '0.5px solid rgba(255, 255, 255, 0.1)';
        } else {
            navbar.style.background = 'transparent';
            navbar.style.backdropFilter = 'none';
            navbar.style.borderBottom = 'none';
        }
    });

    // Parallax para cards flotantes
    const floatingCards = document.querySelectorAll('.floating-card');
    window.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        floatingCards.forEach((card, index) => {
            const speed = (index + 1) * 5;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            card.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Intersection Observer para animaciones
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animar elementos al entrar en viewport
    const animatedElements = document.querySelectorAll('.feature-card, .pricing-card');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = `all 0.8s cubic-bezier(0.28, 0.11, 0.32, 1) ${index * 0.1}s`;
        observer.observe(el);
    });

    // Efecto contador para stats
    const statsNumber = document.querySelector('.stats-number');
    if (statsNumber) {
        const target = parseInt(statsNumber.textContent.replace(/\D/g, ''));
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                statsNumber.textContent = target.toLocaleString() + '+';
                clearInterval(timer);
            } else {
                statsNumber.textContent = Math.floor(current).toLocaleString() + '+';
            }
        }, 30);
    }
});