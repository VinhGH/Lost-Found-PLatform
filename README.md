# Lost & Found Platform

A comprehensive web application for managing lost and found items with AI-powered matching capabilities, real-time chat, and notification system.

## 🌟 Features

- **User Authentication & Management**
  - Secure user registration and login
  - Role-based access control (User, Moderator, Admin)
  - Profile management and settings

- **Lost & Found Posts**
  - Create and manage lost/found item posts
  - Upload multiple images for each post
  - Advanced search and filtering
  - Location-based post discovery

- **AI-Powered Matching**
  - Automatic matching of lost and found items
  - Confidence scoring for matches
  - Manual match creation and management
  - Match status tracking

- **Real-time Communication**
  - Chat system for matched users
  - Real-time notifications
  - Socket.io integration for live updates

- **Notification System**
  - Match notifications
  - Comment and interaction alerts
  - System announcements
  - Real-time notification updates

- **Admin Dashboard**
  - User management
  - Post moderation
  - System statistics
  - Match management

## 🏗️ Technology Stack

### Backend
- **Express.js** - Web framework
- **SQL Server** - Database
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Material-UI** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time features

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- SQL Server (2019 or higher)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/lost-found-platform.git
   cd lost-found-platform
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your database credentials
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
lost-found-platform/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── index.js           # App entry point
│   │   ├── routes/            # API routes
│   │   ├── config/            # Database config
│   │   ├── middleware/        # Custom middleware
│   │   ├── modules/           # Feature modules
│   │   └── utils/             # Utility functions
│   └── package.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.js             # Main app component
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── context/           # React context
│   └── package.json
└── docs/                      # Documentation
    ├── backend.md             # Backend documentation
    ├── frontend.md            # Frontend documentation
    └── README.md              # System overview
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

The application uses the following main tables:
- **Users** - User accounts and profiles
- **Posts** - Lost and found item posts
- **Matches** - AI-generated and manual matches
- **Notifications** - System notifications
- **Chats** - Chat conversations
- **Messages** - Chat messages

See `docs/backend.md` for detailed database schema.

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- SQL injection prevention
- File upload restrictions
- Role-based access control

## 📱 User Interface

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Material Design** - Modern, clean interface
- **Real-time Updates** - Live notifications and chat
- **Intuitive Navigation** - Easy-to-use interface
- **Accessibility** - Screen reader friendly

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

## 📚 Documentation

- [System Overview](docs/README.md) - Complete system documentation
- [Backend Documentation](docs/backend.md) - API and database details
- [Frontend Documentation](docs/frontend.md) - UI and component details

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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
- Geolocation-based search
- QR code integration

## 👥 Team

- **Backend Development** - Express.js, SQL Server, Socket.io
- **Frontend Development** - React, Material-UI, Vite
- **Database Design** - SQL Server schema and optimization
- **UI/UX Design** - Material Design principles

## 📈 Performance

- **Backend** - Optimized database queries, connection pooling
- **Frontend** - Code splitting, lazy loading, optimized bundles
- **Real-time** - Efficient Socket.io implementation
- **Caching** - Strategic caching for improved performance

---

**Lost & Found Platform** - Helping people find their lost items and return found items to their owners.
