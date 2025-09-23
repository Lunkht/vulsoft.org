document.addEventListener('DOMContentLoaded', () => {
    class Chatbot {
        constructor() {
            this.API_URL = 'http://localhost:8001/api/chatbot/chat';
            this.storageKey = 'vulsoft_chatbot_history';
            this.isOpen = false;
            this.conversationHistory = [
                { "role": "system", "content": "You are a helpful assistant for Vulsoft, a software development company. Your name is VulsoftAI. You answer in French." }
            ];
            this.conversationHistory = [];
            this.init();
        }

        init() {
            this.loadHistory();
            this.createElements();
            this.renderHistory();
            this.addEventListeners();
        }

        loadHistory() {
            const savedHistory = localStorage.getItem(this.storageKey);
            this.conversationHistory = savedHistory ? JSON.parse(savedHistory) : [
                { "role": "system", "content": "You are a helpful assistant for Vulsoft, a software development company. Your name is VulsoftAI. You answer in French." },
                { "role": "assistant", "content": "Bonjour ! Je suis VulsoftAI. Comment puis-je vous aider ?" }
            ];
        }

        saveHistory() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.conversationHistory));
        }

        createElements() {
            const chatbotHTML = `
                <div id="chatbot-toggler" class="chatbot-toggler">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div id="chatbot-window" class="chatbot-window">
                    <div class="chatbot-header">
                        <h3>🤖 Vulsoft AI Assistant</h3>
                        <button id="chatbot-close" class="chatbot-close-btn">&times;</button>
                    </div>
                    <div id="chat-log" class="chat-log">
                        <div class="message bot-message">
                            Bonjour ! Je suis VulsoftAI. Comment puis-je vous aider ?
                        </div>
                        <!-- Les messages seront affichés ici par JavaScript -->
                    </div>
                    <div class="chat-input-area">
                        <input type="text" id="chat-input" placeholder="Posez votre question...">
                        <button id="chat-submit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', chatbotHTML);

            this.toggler = document.getElementById('chatbot-toggler');
            this.window = document.getElementById('chatbot-window');
            this.closeBtn = document.getElementById('chatbot-close');
            this.chatLog = document.getElementById('chat-log');
            this.input = document.getElementById('chat-input');
            this.submitBtn = document.getElementById('chat-submit');
        }

        renderHistory() {
            this.chatLog.innerHTML = '';
            this.conversationHistory.forEach(message => {
                if (message.role === 'user' || message.role === 'assistant') {
                    this.addMessage(message.content, message.role === 'assistant' ? 'bot' : 'user');
                }
            });
        }

        addEventListeners() {
            this.toggler.addEventListener('click', () => this.toggle());
            this.closeBtn.addEventListener('click', () => this.close());
            this.submitBtn.addEventListener('click', () => this.sendMessage());
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        toggle() {
            this.isOpen = !this.isOpen;
            this.window.classList.toggle('open');
        }

        close() {
            if (!this.isOpen) return;
            this.isOpen = false;
            this.window.classList.remove('open');
        }

        addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', `${sender}-message`);
            messageDiv.textContent = text;
            this.chatLog.appendChild(messageDiv);
            this.chatLog.scrollTop = this.chatLog.scrollHeight;
        }

        showTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.classList.add('message', 'bot-message', 'typing-indicator');
            typingDiv.innerHTML = '<span></span><span></span><span></span>';
            this.chatLog.appendChild(typingDiv);
            this.chatLog.scrollTop = this.chatLog.scrollHeight;
            return typingDiv;
        }

        async sendMessage() {
            const messageText = this.input.value.trim();
            if (!messageText) return;

            this.addMessage(messageText, 'user');
            this.conversationHistory.push({ "role": "user", "content": messageText });
            this.saveHistory();

            this.input.value = '';
            const typingIndicator = this.showTypingIndicator();

            try {
                const response = await fetch(this.API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: this.conversationHistory }),
                    body: JSON.stringify({ messages: this.conversationHistory.slice(-10) }), // Envoie les 10 derniers messages pour le contexte
                });

                typingIndicator.remove();

                if (!response.ok) throw new Error((await response.json()).detail || 'Erreur serveur');

                const data = await response.json();
                this.addMessage(data.reply, 'bot');
                this.conversationHistory.push({ "role": "assistant", "content": data.reply });
                this.saveHistory();

            } catch (error) {
                console.error('Erreur du chatbot:', error);
                typingIndicator.remove();
                this.addMessage(`Désolé, une erreur est survenue: ${error.message}`, 'bot-message', 'error');
            }
        }
    }

    new Chatbot();
});