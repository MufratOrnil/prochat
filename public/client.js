const socket = io({ reconnectionAttempts: 5, reconnectionDelay: 1000 });
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-input');
const fileButton = document.getElementById('file-button');
const filePreview = document.getElementById('file-preview');
const typingIndicator = document.getElementById('typing-indicator');
const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const usernameDisplay = document.getElementById('username');
const logoutButton = document.getElementById('logout-button');
const errorMessage = document.getElementById('error-message');
const userList = document.getElementById('user-list');

let selectedFile = null;
let typingUsers = new Set();
let currentUsername = null;

async function checkLogin() {
  try {
    const res = await fetch('/get-username', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.username) {
        currentUsername = data.username;
        loginSection.classList.add('hidden');
        chatSection.classList.remove('hidden');
        usernameDisplay.textContent = data.username;
        socket.emit('register user', data.username);
      } else {
        loginSection.classList.remove('hidden');
        chatSection.classList.add('hidden');
      }
    } else {
      loginSection.classList.remove('hidden');
      chatSection.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error checking login:', error);
    showError('Failed to verify login. Please try again.');
    loginSection.classList.remove('hidden');
    chatSection.classList.add('hidden');
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  setTimeout(() => errorMessage.classList.add('hidden'), 3000);
}

checkLogin();

function sendMessage() {
  const content = messageInput.value.trim();
  if (content && currentUsername) {
    socket.emit('chat message', { user: currentUsername, content });
    messageInput.value = '';
    filePreview.textContent = '';
    selectedFile = null;
    fileInput.value = '';
  } else if (selectedFile && currentUsername) {
    const formData = new FormData();
    formData.append('file', selectedFile);
    fetch('/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('File upload failed');
      })
      .then(({ filename }) => {
        const type = selectedFile.type.startsWith('image/') ? 'image' : 'file';
        socket.emit('chat message', {
          user: currentUsername,
          content: `/uploads/${filename}`,
          type,
          filename: selectedFile.name,
        });
        messageInput.value = '';
        filePreview.textContent = '';
        selectedFile = null;
        fileInput.value = '';
      })
      .catch((error) => {
        showError(`Error: ${error.message}`);
      });
  }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

fileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  selectedFile = fileInput.files[0];
  filePreview.textContent = selectedFile ? `Selected: ${selectedFile.name}` : '';
});

logoutButton.addEventListener('click', () => {
  fetch('/logout', { credentials: 'include' })
    .then(() => {
      socket.emit('user logout', currentUsername);
      loginSection.classList.remove('hidden');
      chatSection.classList.add('hidden');
      messageInput.value = '';
      filePreview.textContent = '';
      selectedFile = null;
      fileInput.value = '';
      chatBox.innerHTML = '';
      userList.innerHTML = '';
      currentUsername = null;
    })
    .catch((error) => {
      showError('Logout failed. Please try again.');
    });
});

messageInput.addEventListener('input', () => {
  if (currentUsername) {
    socket.emit('typing', currentUsername);
  }
});

socket.on('load messages', (messages) => {
  chatBox.innerHTML = '';
  messages.forEach(renderMessage);
});

socket.on('chat message', renderMessage);

function renderMessage(msg) {
  const div = document.createElement('div');
  const isSelf = currentUsername && msg.user === currentUsername;
  div.className = `message ${isSelf ? 'self' : 'other'} animate-slide-in`;
  div.dataset.id = msg.id;
  let content = `
    <div class="flex items-start space-x-3">
      <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
        ${msg.user.charAt(0).toUpperCase()}
      </div>
      <div class="flex-1">
        <div class="flex justify-between">
          <div class="font-semibold text-gray-800">${msg.user}</div>
        </div>
        ${msg.type === 'image' ? `<img src="${msg.content}" alt="Uploaded image" class="max-w-xs h-auto rounded-lg mt-2" />` : 
         msg.type === 'file' ? `<a href="${msg.content}" target="_blank" class="text-blue-500 hover:underline">${msg.filename}</a>` : 
         `<div class="text-gray-700">${msg.content}</div>`}
        <div class="text-xs text-gray-400 mt-1">${new Date(msg.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  `;
  if (isSelf) {
    content += `<button class="delete-btn text-red-500 text-sm hover:underline" onclick="deleteMessage(${msg.id})">Delete</button>`;
  }
  div.innerHTML = content;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (!isSelf && currentUsername) socket.emit('read message', msg.id, currentUsername);
}

socket.on('typing', (user) => {
  typingUsers.add(user);
  updateTypingIndicator();
  setTimeout(() => {
    typingUsers.delete(user);
    updateTypingIndicator();
  }, 3000);
});

function updateTypingIndicator() {
  if (typingUsers.size === 0) {
    typingIndicator.innerHTML = '';
  } else if (typingUsers.size === 1) {
    typingIndicator.innerHTML = `<span class="animate-pulse">${Array.from(typingUsers)[0]} is typing...</span>`;
  } else {
    typingIndicator.innerHTML = `<span class="animate-pulse">${typingUsers.size} users are typing...</span>`;
  }
}

socket.on('read receipt', ({ msgId, readBy }) => {
  const msgElement = document.querySelector(`[data-id="${msgId}"]`);
  if (msgElement) {
    const existingReceipt = msgElement.querySelector('.read-receipt');
    if (existingReceipt) existingReceipt.remove();
    const filteredReadBy = readBy.filter(u => u !== currentUsername);
    if (filteredReadBy.length > 0) {
      const receiptDiv = document.createElement('div');
      receiptDiv.className = 'read-receipt text-xs text-green-500 mt-1';
      receiptDiv.textContent = `Read by ${filteredReadBy.join(' and ')}`;
      msgElement.appendChild(receiptDiv);
    }
  }
});

socket.on('update users', (users) => {
  userList.innerHTML = users.map(user => `
    <div class="flex items-center space-x-2 p-2">
      <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
        ${user.charAt(0).toUpperCase()}
      </div>
      <span class="text-gray-700">${user}</span>
    </div>
  `).join('');
});

socket.on('user logout', (username) => {
  typingUsers.delete(username);
  updateTypingIndicator();
});

function deleteMessage(msgId) {
  socket.emit('delete message', msgId, currentUsername);
}

socket.on('delete message', (msgId) => {
  const msgElement = document.querySelector(`[data-id="${msgId}"]`);
  if (msgElement) msgElement.remove();
});

socket.on('connect', () => {
  if (currentUsername) socket.emit('register user', currentUsername);
});

socket.on('connect_error', (error) => {
  showError('Connection error. Trying to reconnect...');
});