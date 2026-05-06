require('dotenv').config();
const path = require('path');
const fastify = require('fastify')({ 
    logger: true,
    bodyLimit: 1048576 * 2
});

fastify.register(require('@fastify/cors'), {
    origin: true,
});

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/',
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

fastify.post('/api/contact', async (request, reply) => {
    const { name, email, subject, message } = request.body;

    if (!name || !email || !subject || !message) {
        return reply.code(400).send({
            success: false,
            message: 'Всі поля мають бути заповнені.',
        });
    }

    if (!isValidEmail(email)) {
        return reply.code(400).send({
            success: false,
            message: 'Некоректний формат email.',
        });
    }

    try {
        const brevoApiKey = process.env.BREVO_API_KEY;
        const recipientEmail = process.env.RECIPIENT_EMAIL;

        if (!brevoApiKey || !recipientEmail) {
            throw new Error('BREVO_API_KEY або RECIPIENT_EMAIL не налаштовані в .env');
        }

        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': brevoApiKey,
            },
            body: JSON.stringify({
                sender: {
                    name: 'Форма зворотного зв\'язку',
                    email: recipientEmail,
                },
                replyTo: {
                    email: email,
                    name: name,
                },
                to: [
                    {
                        email: recipientEmail,
                        name: 'Власник сайту',
                    },
                ],
                subject: `[Зворотний зв'язок] ${subject}`,
                htmlContent: `
                    <h2>Нове повідомлення з форми зворотного зв'язку</h2>
                    <p><strong>Від:</strong> ${name} (${email})</p>
                    <p><strong>Тема:</strong> ${subject}</p>
                    <p><strong>Повідомлення:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                `,
            }),
        });

        if (!brevoResponse.ok) {
            const errorData = await brevoResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'Помилка відправки email через Brevo');
        }

        const brevoResult = await brevoResponse.json();
        fastify.log.info(`Email успішно відправлено! ID: ${brevoResult.messageId}`);

        return reply.code(200).send({
            success: true,
            message: 'Повідомлення успішно надіслано!',
        });
    } catch (error) {
        fastify.log.error(`Помилка відправки email: ${error.message}`);

        return reply.code(500).send({
            success: false,
            message: 'Сталася помилка при відправці повідомлення. Спробуйте пізніше.',
        });
    }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: HOST });
        console.log(`Сервер запущено на http://${HOST}:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
