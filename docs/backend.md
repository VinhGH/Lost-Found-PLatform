# Backend Documentation

## Overview

The backend is built with Express.js and uses Microsoft SQL Server as the database. It provides a RESTful API for the Lost & Found Platform with features including user authentication, post management, AI matching, real-time chat, and notifications.

## 🏗️ Architecture

### Technology Stack
- **Framework:** Express.js
- **Database:** Microsoft SQL Server
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Real-time:** Socket.io
- **Security:** Helmet, CORS, bcryptjs
- **Validation:** Joi (optional)

### Project Structure
```
backend/
├── src/
│   ├── index.js                  # Application entry point
│   ├── routes/
│   │   └── index.js              # Main router
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── middleware/
│   │   ├── authMiddleware.js     # Authentication middleware
│   │   └── errorHandler.js       # Error handling middleware
│   ├── modules/
│   │   ├── account/              # User authentication
│   │   ├── post/                 # Lost/Found posts
│   │   ├── match/                # AI matching system
│   │   ├── notification/         # Notification system
│   │   └── chat/                 # Real-time chat
│   ├── utils/
│   │   ├── hash.js               # Password hashing utilities
│   │   └── fileUpload.js         # File upload configuration
│   └── uploads/                  # File storage directory
├── package.json
└── env.example
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    fullName NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20),
    role NVARCHAR(50) DEFAULT 'user',
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2
);
```

### Posts Table
```sql
CREATE TABLE Posts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    type NVARCHAR(50) NOT NULL, -- 'lost' or 'found'
    title NVARCHAR(255) NOT NULL,
    description NTEXT NOT NULL,
    location NVARCHAR(255) NOT NULL,
    category NVARCHAR(100) NOT NULL,
    images NVARCHAR(MAX), -- JSON array of image URLs
    contactInfo NVARCHAR(MAX), -- JSON object
    status NVARCHAR(50) DEFAULT 'active',
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2,
    FOREIGN KEY (userId) REFERENCES Users(id)
);
```

### Matches Table
```sql
CREATE TABLE Matches (
    id INT IDENTITY(1,1) PRIMARY KEY,
    lostPostId INT NOT NULL,
    foundPostId INT NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    matchedBy NVARCHAR(50) NOT NULL, -- 'ai' or 'manual'
    status NVARCHAR(50) DEFAULT 'pending',
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2,
    FOREIGN KEY (lostPostId) REFERENCES Posts(id),
    FOREIGN KEY (foundPostId) REFERENCES Posts(id)
);
```

### Notifications Table
```sql
CREATE TABLE Notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    type NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NTEXT NOT NULL,
    data NVARCHAR(MAX), -- JSON object
    isRead BIT DEFAULT 0,
    readAt DATETIME2,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id)
);
```

### Chats Table
```sql
CREATE TABLE Chats (
    id INT IDENTITY(1,1) PRIMARY KEY,
    matchId INT NOT NULL,
    participant1Id INT NOT NULL,
    participant2Id INT NOT NULL,
    status NVARCHAR(50) DEFAULT 'active',
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2,
    FOREIGN KEY (matchId) REFERENCES Matches(id),
    FOREIGN KEY (participant1Id) REFERENCES Users(id),
    FOREIGN KEY (participant2Id) REFERENCES Users(id)
);
```

### Messages Table
```sql
CREATE TABLE Messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chatId INT NOT NULL,
    senderId INT NOT NULL,
    message NTEXT NOT NULL,
    messageType NVARCHAR(50) DEFAULT 'text',
    isRead BIT DEFAULT 0,
    readAt DATETIME2,
    isDeleted BIT DEFAULT 0,
    deletedAt DATETIME2,
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (chatId) REFERENCES Chats(id),
    FOREIGN KEY (senderId) REFERENCES Users(id)
);
```

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/login`
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/profile`
Get current user profile. Requires authentication.

#### PUT `/api/auth/profile`
Update user profile. Requires authentication.

#### PUT `/api/auth/change-password`
Change user password. Requires authentication.

### Posts Routes (`/api/posts`)

#### GET `/api/posts`
Get all posts with optional filters.

**Query Parameters:**
- `type`: 'lost' or 'found'
- `category`: item category
- `location`: location filter
- `page`: page number (default: 1)
- `limit`: items per page (default: 10)
- `search`: search term

#### POST `/api/posts`
Create a new post. Requires authentication.

**Request Body:**
```json
{
  "type": "lost",
  "title": "Lost iPhone 13",
  "description": "Black iPhone 13 with blue case",
  "location": "Central Park, NYC",
  "category": "electronics",
  "images": ["url1", "url2"],
  "contactInfo": {
    "phone": "+1234567890",
    "email": "john@example.com",
    "preferredContact": "phone"
  }
}
```

#### GET `/api/posts/:id`
Get specific post by ID.

#### PUT `/api/posts/:id`
Update post. Requires authentication and ownership.

#### DELETE `/api/posts/:id`
Delete post. Requires authentication and ownership.

#### PUT `/api/posts/:id/resolve`
Mark post as resolved. Requires authentication and ownership.

### Matches Routes (`/api/matches`)

#### GET `/api/matches`
Get user's matches. Requires authentication.

#### GET `/api/matches/:id`
Get specific match by ID. Requires authentication.

#### PUT `/api/matches/:id/status`
Update match status. Requires authentication.

**Request Body:**
```json
{
  "status": "confirmed" // 'pending', 'confirmed', 'rejected', 'resolved'
}
```

#### POST `/api/matches/manual`
Create manual match. Requires authentication.

#### GET `/api/matches/post/:postId/potential`
Find potential matches for a post. Requires authentication.

#### POST `/api/matches/post/:postId/ai-match`
Trigger AI matching for a post. Requires authentication.

### Notifications Routes (`/api/notifications`)

#### GET `/api/notifications`
Get user notifications. Requires authentication.

#### GET `/api/notifications/unread-count`
Get unread notification count. Requires authentication.

#### PUT `/api/notifications/:id/read`
Mark notification as read. Requires authentication.

#### PUT `/api/notifications/mark-all-read`
Mark all notifications as read. Requires authentication.

#### DELETE `/api/notifications/:id`
Delete notification. Requires authentication.

### Chat Routes (`/api/chat`)

#### GET `/api/chat`
Get user's chats. Requires authentication.

#### GET `/api/chat/:id`
Get specific chat. Requires authentication.

#### POST `/api/chat`
Create chat from match. Requires authentication.

#### GET `/api/chat/:id/messages`
Get chat messages. Requires authentication.

#### POST `/api/chat/:id/messages`
Send message. Requires authentication.

**Request Body:**
```json
{
  "message": "Hello, I think I found your item!",
  "messageType": "text"
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "userId": 1,
  "email": "john@example.com",
  "role": "user",
  "iat": 1640995200,
  "exp": 1641600000
}
```

### Role-Based Access Control
- **User:** Can create posts, view matches, send messages
- **Moderator:** Can moderate posts, view all matches
- **Admin:** Full access to all features and user management

### Middleware Usage
```javascript
// Require authentication
router.get('/protected', verifyToken, controller.method);

// Require admin role
router.get('/admin', verifyToken, requireAdmin, controller.method);

// Optional authentication
router.get('/public', optionalAuth, controller.method);
```

## 📁 File Upload

### Configuration
File uploads are handled by Multer with the following configuration:
- **Max file size:** 5MB
- **Allowed types:** JPEG, JPG, PNG, GIF, WebP
- **Max files:** 10 per request
- **Storage:** Local filesystem (configurable for cloud storage)

### Upload Endpoints
```javascript
// Single file upload
router.post('/upload', uploadSingle('image'), controller.upload);

// Multiple files upload
router.post('/upload-multiple', uploadMultiple('images', 5), controller.uploadMultiple);

// Mixed file uploads
router.post('/upload-mixed', uploadFields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 5 }
]), controller.uploadMixed);
```

## 🔄 Real-time Features

### Socket.io Integration
```javascript
// Server-side
io.on('connection', (socket) => {
  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
  });
  
  socket.on('send-message', (data) => {
    // Save message to database
    // Broadcast to chat room
    io.to(`chat-${data.chatId}`).emit('new-message', message);
  });
});
```

### Real-time Events
- **New message:** `new-message`
- **User typing:** `typing`
- **User online:** `user-online`
- **New notification:** `new-notification`

## 🛡️ Security Features

### Password Security
- Bcrypt hashing with 12 salt rounds
- Password strength validation
- Secure password reset flow

### Input Validation
- Request body validation
- SQL injection prevention
- XSS protection
- File upload restrictions

### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
DB_SERVER=your-server
DB_NAME=lost_found_platform
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

### Production Considerations
- Use PM2 for process management
- Set up reverse proxy (Nginx)
- Configure SSL certificates
- Set up database backups
- Monitor application logs
- Use environment-specific configurations

## 🧪 Testing

### Test Structure
```javascript
// Example test
describe('POST /api/auth/login', () => {
  it('should login user with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 📊 Monitoring & Logging

### Logging Configuration
```javascript
// Morgan logging
app.use(morgan('combined'));

// Custom logging
const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`)
};
```

### Health Check
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 🔧 Development Tools

### Scripts
```json
{
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "test": "jest",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix"
}
```

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks
- Jest for testing

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check SQL Server is running
   - Verify connection credentials
   - Ensure database exists

2. **JWT Token Invalid**
   - Check JWT_SECRET is set
   - Verify token expiration
   - Ensure proper token format

3. **File Upload Issues**
   - Check file size limits
   - Verify file types
   - Ensure upload directory exists

4. **CORS Errors**
   - Check CORS_ORIGIN configuration
   - Verify frontend URL
   - Ensure credentials are enabled

### Debug Mode
```bash
DEBUG=app:* npm run dev
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/)
- [JWT.io](https://jwt.io/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Multer Documentation](https://github.com/expressjs/multer)
