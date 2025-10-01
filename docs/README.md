# Lost & Found Platform

A comprehensive web application for managing lost and found items with AI-powered matching capabilities.

## 🏗️ Architecture Overview

### Technology Stack

**Backend:**
- **Framework:** Express.js
- **Database:** Microsoft SQL Server
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Real-time Communication:** Socket.io
- **Security:** Helmet, CORS, bcryptjs

**Frontend:**
- **Framework:** React 18
- **Build Tool:** Vite
- **UI Library:** Material-UI (MUI)
- **Routing:** React Router v6
- **State Management:** React Context API
- **HTTP Client:** Axios

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │  SQL Server DB  │
│                 │    │                 │    │                 │
│  - Material-UI  │◄──►│  - REST API     │◄──►│  - Users        │
│  - React Router │    │  - JWT Auth     │    │  - Posts        │
│  - Context API  │    │  - Socket.io    │    │  - Matches      │
│  - Axios        │    │  - File Upload  │    │  - Notifications│
└─────────────────┘    └─────────────────┘    │  - Chats        │
                                              └─────────────────┘
```

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - User registration and login
  - Role-based access control (User, Moderator, Admin)
  - JWT token-based authentication
  - Password hashing with bcrypt

- **Post Management**
  - Create lost/found item posts
  - Upload multiple images
  - Search and filter posts
  - Mark posts as resolved
  - Edit and delete own posts

- **AI-Powered Matching**
  - Automatic matching of lost and found items
  - Confidence scoring for matches
  - Manual match creation
  - Match status management

- **Real-time Communication**
  - Chat system for matched users
  - Real-time notifications
  - Socket.io integration

- **Notification System**
  - Match notifications
  - Comment notifications
  - System announcements
  - Real-time updates

### Admin Features
- User management
- Post moderation
- System statistics
- Match management
- Notification management

## 📁 Project Structure

```
lost-found-platform/
├── backend/                          # Express + SQL Server
│   ├── src/
│   │   ├── index.js                  # App entry point
│   │   ├── routes/                   # Route definitions
│   │   ├── config/                   # Database configuration
│   │   ├── middleware/               # Custom middleware
│   │   ├── modules/                  # Feature modules
│   │   │   ├── account/              # Authentication
│   │   │   ├── post/                 # Lost/Found posts
│   │   │   ├── match/                # AI Matching
│   │   │   ├── notification/         # Notifications
│   │   │   └── chat/                 # Real-time Chat
│   │   └── utils/                    # Utility functions
│   ├── package.json
│   └── env.example
├── frontend/                         # React + Vite + MUI
│   ├── src/
│   │   ├── App.js                    # Main app component
│   │   ├── components/               # Reusable components
│   │   ├── pages/                    # Page components
│   │   ├── services/                 # API services
│   │   └── context/                  # React context
│   ├── public/
│   └── package.json
└── docs/                             # Documentation
    ├── backend.md                    # Backend documentation
    ├── frontend.md                   # Frontend documentation
    └── README.md                     # This file
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- SQL Server (2019 or higher)
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment configuration:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your database credentials and other settings.

4. **Database setup:**
   - Create a SQL Server database
   - Run the database schema scripts (see backend.md for details)

5. **Start development server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=development
PORT=5000
DB_SERVER=localhost
DB_NAME=lost_found_platform
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📊 Database Schema

### Core Tables
- **Users:** User accounts and profiles
- **Posts:** Lost and found item posts
- **Matches:** AI-generated and manual matches
- **Notifications:** System notifications
- **Chats:** Chat conversations
- **Messages:** Chat messages

See `docs/backend.md` for detailed database schema.

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention
- File upload restrictions

## 🚀 Deployment

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

### Docker Deployment
Docker configurations can be added for containerized deployment.

## 📝 API Documentation

The API follows RESTful conventions:

- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

See `docs/backend.md` for complete API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` folder
- Review the code comments for implementation details

## 🔮 Future Enhancements

- Mobile app development
- Advanced AI matching algorithms
- Email notifications
- Social media integration
- Advanced search with filters
- Image recognition for better matching
- Multi-language support
- Push notifications
