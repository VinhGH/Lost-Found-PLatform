# Frontend Documentation

## Overview

The frontend is built with React 18, Vite, and Material-UI (MUI). It provides a modern, responsive user interface for the Lost & Found Platform with features including user authentication, post management, real-time chat, and notifications.

## 🏗️ Architecture

### Technology Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **UI Library:** Material-UI (MUI) v5
- **Routing:** React Router v6
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Real-time:** Socket.io Client
- **Styling:** Emotion (CSS-in-JS)

### Project Structure
```
frontend/
├── src/
│   ├── App.js                    # Main application component
│   ├── main.jsx                  # Application entry point
│   ├── components/               # Reusable UI components
│   │   ├── NavBar.jsx           # Navigation bar
│   │   ├── Layout.jsx           # Main layout wrapper
│   │   ├── ProtectedRoute.jsx   # Route protection
│   │   └── NotificationBell.jsx # Notification component
│   ├── pages/                    # Page components
│   │   ├── Home.jsx             # Home page
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration page
│   │   ├── CreatePost.jsx       # Create post page
│   │   ├── PostDetail.jsx       # Post details page
│   │   ├── NotificationPage.jsx # Notifications page
│   │   ├── ChatPage.jsx         # Chat page
│   │   └── AdminDashboard.jsx   # Admin dashboard
│   ├── services/                 # API service layer
│   │   ├── api.js               # Axios configuration
│   │   ├── auth.js              # Authentication service
│   │   ├── posts.js             # Posts service
│   │   └── notifications.js     # Notifications service
│   └── context/                  # React context providers
│       └── AuthContext.jsx      # Authentication context
├── public/
│   └── index.html               # HTML template
└── package.json
```

## 🎨 UI Components

### Material-UI Theme
```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});
```

### Component Library

#### Layout Components
- **Layout.jsx:** Main application layout with sidebar and content area
- **NavBar.jsx:** Top navigation bar with user menu and notifications
- **ProtectedRoute.jsx:** Route wrapper for authentication protection

#### Page Components
- **Home.jsx:** Main dashboard with post listings and search
- **Login.jsx:** User authentication form
- **Register.jsx:** User registration form
- **CreatePost.jsx:** Form for creating lost/found posts
- **PostDetail.jsx:** Detailed view of individual posts
- **ChatPage.jsx:** Real-time chat interface
- **NotificationPage.jsx:** Notification management
- **AdminDashboard.jsx:** Administrative interface

#### UI Components
- **NotificationBell.jsx:** Notification dropdown with real-time updates

## 🔐 Authentication System

### AuthContext
```javascript
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Authentication Flow
1. **Login/Register:** User submits credentials
2. **Token Storage:** JWT token stored in localStorage
3. **Context Update:** User state updated in AuthContext
4. **Route Protection:** Protected routes check authentication
5. **API Requests:** Token automatically attached to requests

### Usage Example
```javascript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, login, logout, loading } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login(email, password);
      // User is now logged in
    } catch (error) {
      // Handle login error
    }
  };
  
  return (
    <div>
      {user ? (
        <p>Welcome, {user.fullName}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};
```

## 🛣️ Routing System

### Route Configuration
```javascript
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Protected routes with layout */}
  <Route path="/" element={
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  }>
    <Route index element={<Home />} />
    <Route path="create-post" element={<CreatePost />} />
    <Route path="post/:id" element={<PostDetail />} />
    <Route path="notifications" element={<NotificationPage />} />
    <Route path="chat" element={<ChatPage />} />
    <Route path="chat/:id" element={<ChatPage />} />
    <Route path="admin" element={
      <ProtectedRoute requireAdmin>
        <AdminDashboard />
      </ProtectedRoute>
    } />
  </Route>
</Routes>
```

### Route Protection
```javascript
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user.role !== 'admin') {
    return <AccessDenied />;
  }
  
  return children;
};
```

## 🌐 API Integration

### Axios Configuration
```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Service Layer
```javascript
class PostsService {
  async getPosts(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const response = await apiMethods.get(`/posts?${params.toString()}`);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
  
  async createPost(postData) {
    try {
      const response = await apiMethods.post('/posts', postData);
      return handleApiSuccess(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
```

## 📱 Responsive Design

### Breakpoints
```javascript
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});
```

### Responsive Components
```javascript
const ResponsiveComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 2
    }}>
      {/* Content */}
    </Box>
  );
};
```

## 🔔 Real-time Features

### Socket.io Integration
```javascript
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

// Listen for notifications
socket.on('new-notification', (notification) => {
  // Update notification state
  setNotifications(prev => [notification, ...prev]);
});

// Join chat room
socket.emit('join-chat', chatId);

// Listen for new messages
socket.on('new-message', (message) => {
  setMessages(prev => [...prev, message]);
});
```

### Notification System
```javascript
const NotificationBell = () => {
  const { notifications, unreadCount } = useNotifications();
  
  return (
    <IconButton>
      <Badge badgeContent={unreadCount} color="error">
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
};
```

## 📊 State Management

### Context Pattern
```javascript
// AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateProfile,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Custom Hooks
```javascript
// usePosts.js
export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const getPosts = async (filters) => {
    setLoading(true);
    try {
      const data = await postsService.getPosts(filters);
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return { posts, loading, error, getPosts };
};
```

## 🎨 Styling Guidelines

### Material-UI Components
```javascript
// Use MUI components for consistency
<Button variant="contained" color="primary">
  Submit
</Button>

<TextField
  label="Email"
  variant="outlined"
  fullWidth
  margin="normal"
/>
```

### Custom Styling
```javascript
// Use sx prop for custom styles
<Box sx={{
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  p: 3,
  backgroundColor: 'background.paper',
  borderRadius: 2,
  boxShadow: 1,
}}>
  {/* Content */}
</Box>
```

### Theme Customization
```javascript
// Extend theme with custom values
const theme = createTheme({
  palette: {
    custom: {
      main: '#ff6b6b',
      light: '#ff8e8e',
      dark: '#ff5252',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});
```

## 📁 File Organization

### Component Structure
```javascript
// Each component should be self-contained
const MyComponent = () => {
  // 1. State declarations
  const [state, setState] = useState();
  
  // 2. Effect hooks
  useEffect(() => {
    // Side effects
  }, []);
  
  // 3. Event handlers
  const handleClick = () => {
    // Event logic
  };
  
  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### Import Organization
```javascript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party imports
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// 3. Local imports
import { useAuth } from '../context/AuthContext';
import { postsService } from '../services/posts';
```

## 🧪 Testing

### Component Testing
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import Login from '../pages/Login';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

test('renders login form', () => {
  renderWithProviders(<Login />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

### Service Testing
```javascript
import { postsService } from '../services/posts';
import { apiMethods } from '../services/api';

jest.mock('../services/api');

test('getPosts calls API with correct parameters', async () => {
  const mockResponse = { data: { success: true, data: { posts: [] } } };
  apiMethods.get.mockResolvedValue(mockResponse);
  
  await postsService.getPosts({ type: 'lost' });
  
  expect(apiMethods.get).toHaveBeenCalledWith('/posts?type=lost');
});
```

## 🚀 Build & Deployment

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
```

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_ENV=development
```

### Production Build
```bash
npm run build
```

The build creates a `dist` folder with optimized static files ready for deployment.

## 🔧 Development Tools

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};
```

## 🐛 Debugging

### React Developer Tools
- Install React Developer Tools browser extension
- Use Components tab to inspect component tree
- Use Profiler tab to analyze performance

### Console Debugging
```javascript
// Use console.log for debugging
console.log('Component state:', state);

// Use React DevTools
import { useDebugValue } from 'react';

const useCustomHook = (value) => {
  useDebugValue(value, value => `Custom: ${value}`);
  return value;
};
```

### Error Boundaries
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    
    return this.props.children;
  }
}
```

## 📚 Best Practices

### Component Design
- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Use TypeScript for better type safety

### Performance
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Use useCallback for event handlers passed to children
- Lazy load routes and components

### Accessibility
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

### Code Quality
- Follow consistent naming conventions
- Write meaningful comments
- Use ESLint and Prettier
- Write unit tests for critical functionality

## 🆘 Troubleshooting

### Common Issues

1. **Build Errors**
   - Check for syntax errors
   - Verify all imports are correct
   - Clear node_modules and reinstall

2. **API Connection Issues**
   - Verify API URL in environment variables
   - Check CORS configuration
   - Ensure backend is running

3. **Authentication Issues**
   - Check token storage in localStorage
   - Verify JWT token format
   - Check token expiration

4. **Styling Issues**
   - Verify MUI theme configuration
   - Check for CSS conflicts
   - Use browser dev tools to inspect styles

### Debug Mode
```bash
# Enable React strict mode
# Check browser console for warnings
# Use React DevTools profiler
```

## 📖 Additional Resources

- [React Documentation](https://reactjs.org/docs/)
- [Material-UI Documentation](https://mui.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
