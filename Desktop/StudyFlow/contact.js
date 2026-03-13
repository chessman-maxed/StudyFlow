

// Contact Form Script
document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formMessage = document.getElementById('formMessage');
    const messageDiv = formMessage.querySelector('div');
    const messageText = formMessage.querySelector('p');

    // Show success message (in a real app, this would send the form data)
    formMessage.classList.remove('hidden');
    messageDiv.className = 'p-4 rounded-lg bg-green-500/20 border border-green-500/30';
    messageText.className = 'text-green-400 text-sm';
    messageText.textContent = 'Thank you for your message! We\'ll get back to you within 24 hours.';

    // Reset form
    this.reset();

    // Hide message after 5 seconds
    setTimeout(() => {
        formMessage.classList.add('hidden');
    }, 5000);
});

// Mobile menu
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
});
