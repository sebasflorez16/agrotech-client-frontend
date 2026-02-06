// AgroTech Digital - Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navbarHeight = 80;
                const targetPosition = target.offsetTop - navbarHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(0, 0, 0, 0.95)';
            navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Intersection Observer for animations
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

    // Animate elements
    const animateElements = document.querySelectorAll('.feature-card, .pricing-card');
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.8s cubic-bezier(0.28, 0.11, 0.32, 1) ${index * 0.1}s`;
        observer.observe(el);
    });

    // Counter animation
    const statsNumber = document.querySelector('.stats-number');
    if (statsNumber) {
        let hasAnimated = false;
        const animateCounter = () => {
            if (hasAnimated) return;
            hasAnimated = true;
            
            const target = 2500;
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    statsNumber.textContent = '2.5K+';
                    clearInterval(timer);
                } else {
                    const value = Math.floor(current);
                    if (value >= 1000) {
                        statsNumber.textContent = (value / 1000).toFixed(1) + 'K+';
                    } else {
                        statsNumber.textContent = value + '+';
                    }
                }
            }, 30);
        };

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter();
                }
            });
        }, { threshold: 0.5 });

        statsObserver.observe(statsNumber);
    }

    console.log('AgroTech Digital Landing Page loaded successfully');
});