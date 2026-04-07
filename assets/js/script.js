// Pricing toggle functionality
document.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update pricing display based on selected plan
        const planType = this.dataset.plan;
        updatePricingDisplay(planType);
    });
});

function updatePricingDisplay(planType) {
    const isAnnual = planType === 'annual';
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach(card => {
        const prices = card.querySelectorAll('.amount');
        const periods = card.querySelectorAll('.period');
        
        if (isAnnual) {
            // Show annual pricing
            prices.forEach(price => {
                const monthlyPrice = parseInt(price.textContent.replace(',', ''));
                const annualPrice = Math.round(monthlyPrice * 12 * 0.8); // 20% discount
                price.textContent = annualPrice.toLocaleString();
            });
            periods.forEach(period => {
                period.textContent = '/year';
            });
        } else {
            // Show monthly pricing
            prices.forEach(price => {
                const monthlyPrice = parseInt(price.textContent.replace(',', ''));
                price.textContent = monthlyPrice.toLocaleString();
            });
            periods.forEach(period => {
                period.textContent = '/month';
            });
        }
    });
}

// Add hover effects to pricing cards
document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile menu toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.pricing-card, .step, .stat');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Button hover effects
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.width = '0';
        ripple.style.height = '0';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.5)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.animation = 'ripple 0.6s ease-out';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            width: 200px;
            height: 200px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Pricing card hover effect
document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        if (!this.classList.contains('popular')) {
            this.style.transform = 'translateY(0) scale(1)';
        } else {
            this.style.transform = 'translateY(-4px) scale(1.05)';
        }
    });
});

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (element.textContent.includes('K')) {
            element.textContent = Math.floor(current) + 'K+';
        } else if (element.textContent.includes('+')) {
            element.textContent = Math.floor(current) + '+';
        } else if (element.textContent.includes('★')) {
            element.textContent = current.toFixed(1) + '★';
        } else {
            element.textContent = Math.floor(current) + '+';
        }
    }, 16);
}

// Trigger counter animation when stats are visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            const statNumber = entry.target.querySelector('.stat-number');
            
            if (statNumber.textContent.includes('50K')) {
                animateCounter(statNumber, 50, 2000);
            } else if (statNumber.textContent.includes('200')) {
                animateCounter(statNumber, 200, 2000);
            } else if (statNumber.textContent.includes('4.8')) {
                animateCounter(statNumber, 4.8, 2000);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

// Mobile menu close on link click
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Form validation (for future forms)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return re.test(phone);
}

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Add typing effect to hero title (optional enhancement)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect on page load
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && window.innerWidth > 768) {
        const originalText = heroTitle.textContent;
        typeWriter(heroTitle, originalText, 50);
    }
});

// Auth Modal Logic
const authModal = document.getElementById('authModal');
let currentStep = 1;

function openAuthModal() {
    authModal.style.display = 'flex';
    goToStep(1);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeAuthModal() {
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.auth-step').forEach(el => el.classList.remove('active'));
    // Show target step
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update progress bar
    document.querySelectorAll('.progress-step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        if (stepNum <= step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    currentStep = step;
}

function moveFocus(current, nextId) {
    if (current.value.length === 1) {
        document.getElementById(nextId).focus();
    }
}

function finishOtp() {
    // Auto-complete after typing last digit (simulation)
    setTimeout(() => {
        completeRegistration();
    }, 500);
}

function completeRegistration() {
    const fullName = document.getElementById('fullName').value || 'Adebayo';
    const phone = document.getElementById('phoneNumber').value || '08123456789';
    
    // Save to Auth state
    Auth.login(fullName, phone);
    
    // Move to success step
    goToStep(3);
}

function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeAuthModal();
    }
});

// Attach triggers to buttons
document.addEventListener('DOMContentLoaded', () => {
    // "Get Started" & "Start Free Trial" buttons
    const startButtons = document.querySelectorAll('.nav-menu .btn-primary, .hero-actions .btn-primary');
    startButtons.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            openAuthModal();
        };
    });

    // Pricing Plan buttons
    const planButtons = document.querySelectorAll('.pricing-card button');
    planButtons.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            // Store selected plan in localStorage for the dashboard to pick up
            const planCard = btn.closest('.pricing-card');
            const planName = planCard.querySelector('h3').textContent.toLowerCase();
            localStorage.setItem('temp_selected_plan', planName);
            openAuthModal();
        };
    });
});

console.log('WashPass NG - Premium Car Wash Subscription Platform');

