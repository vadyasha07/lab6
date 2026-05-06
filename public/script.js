document.getElementById('contactForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formStatus = document.getElementById('formStatus');
    const submitButton = this.querySelector('button[type="submit"]');

    // Отримуємо дані з форми
    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim(),
    };

    // Блокуємо кнопку на час відправки
    submitButton.disabled = true;
    submitButton.textContent = 'Надсилається...';
    formStatus.className = 'form-status';
    formStatus.textContent = '';

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success) {
            formStatus.className = 'form-status success';
            formStatus.textContent = result.message;
            // Очищаємо форму
            document.getElementById('contactForm').reset();
        } else {
            formStatus.className = 'form-status error';
            formStatus.textContent = result.message;
        }
    } catch (error) {
        formStatus.className = 'form-status error';
        formStatus.textContent = 'Сталася помилка мережі. Спробуйте ще раз.';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Надіслати';
    }
});
