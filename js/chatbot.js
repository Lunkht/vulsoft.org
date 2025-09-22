class VulsoftChatbot {
    constructor() {
        this.isOpen = false;
        this.history = [];
        this.init();
    }

    init() {
        this.toggler = document.getElementById('chatbot-toggler');
        this.window = document.getElementById('chatbot-window');
        this.closeBtn = document.getElementById('chatbot-close');
        this.log = document.getElementById('chat-log');
        this.input = document.getElementById('chat-input');
        this.submitBtn = document.getElementById('chat-submit');

        if (!this.toggler || !this.window) {
            console.warn('Chatbot UI elements not found.');
            return;
        }

        this.toggler.addEventListener('click', () => this.toggle());
        this.closeBtn.addEventListener('click', () => this.toggle());
        this.submitBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.window.classList.toggle('open');
        this.toggler.classList.toggle('open');
    }

    async sendMessage() {
        const messageText = this.input.value.trim();
        if (!messageText) return;

        this.appendMessage(messageText, 'user');
        this.input.value = '';
        this.setTyping(true);

        try {
            const response = await fetch('http://localhost:8001/api/chatbot/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    history: this.history
                })
            });

            if (!response.ok) {
                throw new Error('La réponse du serveur n\'est pas valide.');
            }

            const data = await response.json();
            this.setTyping(false);
            this.appendMessage(data.response, 'bot');

            // Update history
            this.history.push({ role: 'user', content: messageText });
            this.history.push({ role: 'assistant', content: data.response });
            // Keep history short
            if (this.history.length > 6) {
                this.history = this.history.slice(-6);
            }

        } catch (error) {
            this.setTyping(false);
            this.appendMessage("Désolé, je rencontre un problème technique. Veuillez réessayer plus tard.", 'bot', true);
            console.error('Chatbot error:', error);
        }
    }

    appendMessage(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        if (isError) {
            messageDiv.classList.add('error');
        }
        messageDiv.textContent = text;
        this.log.appendChild(messageDiv);
        this.log.scrollTop = this.log.scrollHeight;
    }

    setTyping(isTyping) {
        let typingIndicator = this.log.querySelector('.typing-indicator');
        if (isTyping) {
            if (!typingIndicator) {
                typingIndicator = document.createElement('div');
                typingIndicator.classList.add('message', 'bot-message', 'typing-indicator');
                typingIndicator.innerHTML = '<span></span><span></span><span></span>';
                this.log.appendChild(typingIndicator);
                this.log.scrollTop = this.log.scrollHeight;
            }
        } else {
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.vulsoftChatbot = new VulsoftChatbot();
});