const socket = io();

let username = '';
let currentReplyTo = null;
let selectedMessages = [];
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingTimer = null;
let recordingSeconds = 0;

// ========== DOM ELEMENTS ==========
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const voiceRecording = document.getElementById('voiceRecording');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const recordingTime = document.getElementById('recordingTime');
const replyBar = document.getElementById('replyBar');
const replyText = document.getElementById('replyText');
const cancelReplyBtn = document.getElementById('cancelReplyBtn');
const onlineCount = document.getElementById('onlineCount');

// ========== JOIN CHAT ==========
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

function joinChat() {
    username = usernameInput.value.trim();
    if (!username) {
        alert('Please enter a username');
        return;
    }
    socket.emit('user-join', username);
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    document.getElementById('currentUser').textContent = username;
}

// ========== SOCKET EVENTS ==========
socket.on('previous-messages', (messages) => {
    messagesArea.innerHTML = '';
    messages.forEach(msg => displayMessage(msg));
});

socket.on('receive-message', (data) => {
    displayMessage(data);
    scrollToBottom();
});

socket.on('receive-voice', (data) => {
    displayVoiceMessage(data);
    scrollToBottom();
});

socket.on('user-list', (users) => {
    onlineCount.textContent = `${users.length} online`;
});

socket.on('system-message', (msg) => {
    const div = document.createElement('div');
    div.className = 'system-message';
    div.textContent = msg;
    messagesArea.appendChild(div);
    scrollToBottom();
});

socket.on('user-typing', (data) => {
    showTypingIndicator(data.username);
});

socket.on('user-stopped-typing', () => {
    removeTypingIndicator();
});

// ========== DISPLAY MESSAGE ==========
function displayMessage(data) {
    const isSelf = data.username === username;
    const div = document.createElement('div');
    div.className = `message ${isSelf ? 'self' : 'other'}`;
    div.dataset.messageId = data.id;

    let replyHtml = '';
    if (data.replyTo) {
        const repliedMsg = getMessageById(data.replyTo);
        if (repliedMsg) {
            replyHtml = `<div class="reply-indicator">↩️ ${repliedMsg.username}: ${repliedMsg.message.substring(0, 40)}${repliedMsg.message.length > 40 ? '...' : ''}</div>`;
        }
    }

    div.innerHTML = `
        ${!isSelf ? `<span class="username">${data.username}</span>` : ''}
        ${replyHtml}
        <span>${data.message}</span>
        <span class="time">${new Date(data.timestamp).toLocaleTimeString()}</span>
    `;

    // Click to select message for reply
    div.addEventListener('click', () => {
        if (data.username !== username) {
            selectMessageForReply(data.id, data.username, data.message);
        }
    });

    messagesArea.appendChild(div);
}

function displayVoiceMessage(data) {
    const isSelf = data.username === username;
    const div = document.createElement('div');
    div.className = `message ${isSelf ? 'self' : 'other'}`;
    div.dataset.messageId = data.id;

    div.innerHTML = `
        ${!isSelf ? `<span class="username">${data.username}</span>` : ''}
        <div class="voice-msg">
            <button class="play-btn" onclick="playVoice('${data.audio}')">▶</button>
            <div class="waveform">
                <span></span><span></span><span></span><span></span><span></span>
            </div>
            <span style="font-size:12px; color:#888;">${Math.round(data.audio.length / 1000)}s</span>
        </div>
        <span class="time">${new Date(data.timestamp).toLocaleTimeString()}</span>
    `;

    messagesArea.appendChild(div);
}

// ========== REPLY FUNCTIONALITY ==========
function selectMessageForReply(id, msgUsername, msgContent) {
    currentReplyTo = id;
    replyBar.style.display = 'block';
    replyText.textContent = `Replying to ${msgUsername}: ${msgContent.substring(0, 50)}${msgContent.length > 50 ? '...' : ''}`;
}

cancelReplyBtn.addEventListener('click', () => {
    currentReplyTo = null;
    replyBar.style.display = 'none';
});

function getMessageById(id) {
    const messages = document.querySelectorAll('.message');
    for (const msg of messages) {
        if (msg.dataset.messageId == id) {
            return {
                username: msg.querySelector('.username')?.textContent || 'User',
                message: msg.querySelector('span:not(.username):not(.time)')?.textContent || ''
            };
        }
    }
    return null;
}

// ========== SEND MESSAGE ==========
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    socket.emit('send-message', {
        username: username,
        message: text,
        replyTo: currentReplyTo
    });

    messageInput.value = '';
    currentReplyTo = null;
    replyBar.style.display = 'none';
    messageInput.style.height = 'auto';
}

// ========== TYPING INDICATOR ==========
let typingTimeout;

messageInput.addEventListener('input', () => {
    if (messageInput.value.trim()) {
        socket.emit('typing', { username });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stop-typing');
        }, 1000);
    } else {
        socket.emit('stop-typing');
    }
});

let typingIndicatorElement = null;

function showTypingIndicator(name) {
    removeTypingIndicator();
    typingIndicatorElement = document.createElement('div');
    typingIndicatorElement.className = 'typing-indicator';
    typingIndicatorElement.innerHTML = `
        <span>${name} is typing</span>
        <div class="dots">
            <span></span><span></span><span></span>
        </div>
    `;
    messagesArea.appendChild(typingIndicatorElement);
    scrollToBottom();
}

function removeTypingIndicator() {
    if (typingIndicatorElement) {
        typingIndicatorElement.remove();
        typingIndicatorElement = null;
    }
}

// ========== VOICE RECORDING ==========
voiceBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', stopRecording);

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecording = true;
        recordingSeconds = 0;

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = () => {
                const audioData = reader.result;
                socket.emit('voice-message', {
                    username: username,
                    audio: audioData
                });
            };
            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        voiceBtn.classList.add('recording');
        voiceRecording.style.display = 'flex';
        recordingTime.textContent = '0s';

        recordingTimer = setInterval(() => {
            recordingSeconds++;
            recordingTime.textContent = `${recordingSeconds}s`;
        }, 1000);

    } catch (error) {
        alert('Microphone access denied. Please allow microphone permission.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        clearInterval(recordingTimer);
        voiceBtn.classList.remove('recording');
        voiceRecording.style.display = 'none';
        recordingTime.textContent = '0s';
    }
}

function playVoice(audioData) {
    const audio = new Audio(audioData);
    audio.play();
}

// ========== SCROLL ==========
function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// ========== AUTO-RESIZE TEXTAREA ==========
messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

// ========== LOGOUT ==========
document.getElementById('logoutBtn').addEventListener('click', () => {
    window.location.reload();
});
