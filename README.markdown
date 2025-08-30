# ProChat - Real-Time Chat Application with File Sharing

ProChat is a real-time chat application built with Node.js, Express, and Socket.IO, featuring a simple yet effective user interface for seamless communication. It supports real-time messaging, file and image uploads, typing indicators, read receipts, message deletion, and a live online user list. This application is designed for developers and startups looking for a lightweight, customizable chat solution.

## Features

- **Real-Time Messaging:** Instant message delivery to all connected users.
- **File and Image Uploads:** Share files or images (up to 5MB) with inline image display or downloadable file links.
- **Session-Based Authentication:** Simple username-based login without passwords.
- **Read Receipts:** Track which users have read your messages.
- **Typing Indicators:** Displays when users are typing.
- **Message Deletion:** Delete your own messages, with updates reflected for all users.
- **Online User List:** See who is currently online, with avatars based on usernames.
- **Responsive Design:** Optimized for both desktop and mobile devices.

## Prerequisites

To run ProChat locally, ensure you have the following installed:

- **Node.js** (version 14 or higher) and **npm** (included with Node.js).
- A modern web browser (e.g., Chrome, Firefox, Edge).
- **Git** (optional, for cloning the repository).

## Installation

Follow these steps to set up and run ProChat on your local machine:

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/chat-app.git
   cd chat-app
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

   This installs all required Facquire dependencies:

- **express**: "^4.17.1"
- **socket.io**: "^4.5.0"
- **express-session**: "^1.17.2"
- **multer**: "^1.4.4"

## Usage

1. Start the server:

   ```bash
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000/login`.
3. Enter a username (max 20 characters) and click "Login".
4. You’ll be redirected to the chat interface at `http://localhost:3000/chat`.
5. Start chatting, uploading files, or viewing the online user list.
6. To log out, click the "Logout" button in the top-right corner.

## Project Structure

```
chat-app/
├── public/
│   ├── uploads/           # Stores uploaded files (auto-created)
│   ├── client.js          # Client-side JavaScript for real-time functionality
│   ├── index.html         # Main HTML file for the frontend
│   └── styles.css         # CSS styles for the application
├── package.json           # Project metadata and dependencies
├── server.js              # Server-side logic with Express and Socket.IO

## Troubleshooting
- **Port Already in Use:** If you see an error about port 3000, either change the port in `server.js` (edit `const PORT = process.env.PORT || 3000;`) or terminate the process using the port (`kill -9 <pid>` on Linux/Mac or Task Manager on Windows).
- **File Upload Fails:** Ensure the file is under 5MB and that the `public/uploads/` folder has write permissions.
- **Connection Issues:** Verify the server is running and you’re accessing `http://localhost:3000`. Check browser console for errors.
- **CORS Errors:** Ensure the `cors` origin in `server.js` matches your frontend URL (default: `http://localhost:3000`).
- **Messages Not Persisting:** The app stores messages in memory, so they are lost on server restart. For persistent storage, integrate a database (not included in this version).

## Notes
- **Development Setup:** The app uses non-secure cookies (`secure: false` in `server.js`) and is intended for development, not production. For production, enable HTTPS and set `cookie: { secure: true }`.
- **File Storage:** Uploaded files are stored in `public/uploads/`, which is created automatically on the first upload.
- **Scalability:** This app is lightweight and memory-based. For production, consider adding a database (e.g., MongoDB) for message persistence and Redis for session management.
- **Security:** No password authentication is implemented. For production, add proper authentication (e.g., OAuth or JWT).

## Contributing
Contributions are welcome! To contribute:
1. Fork the repository on GitHub.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a clear description of your changes.

Please open an issue to discuss proposed changes before submitting a pull request.

## License
This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute as needed.

## Acknowledgments
- Built with [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), and [Socket.IO](https://socket.io/) for real-time communication.
- Styled with custom CSS for a clean, responsive user interface.
- Designed as a lightweight solution for developers and startups, inspired by the need for simple, real-time collaboration tools.
```