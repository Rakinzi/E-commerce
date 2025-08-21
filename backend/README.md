# E-commerce Backend API

A scalable, production-ready e-commerce backend built with Express.js, TypeScript, MongoDB, and Redis. Features comprehensive authentication, role-based access control, and a complete shopping cart and order management system.

## 🚀 Features

### Core Functionality
- **User Management** - Registration, authentication, profile management
- **Product Catalog** - CRUD operations, search, filtering, categories
- **Shopping Cart** - Add/remove items, quantity updates, validation
- **Order System** - Order creation, status tracking, payment processing
- **Admin Dashboard** - User management, analytics, system monitoring

### Security & Authentication
- JWT-based authentication with sliding sessions
- Role-based access control (Admin, Vendor, Customer)
- HTTP-only cookies with CSRF protection
- Rate limiting and security headers
- Password hashing with bcrypt (12 rounds)

### Technical Features
- **API Versioning** - Clean `/api/v1/` structure
- **Database Migrations** - Version-controlled schema changes
- **Data Seeding** - Sample data for development
- **CSV Import** - Bulk product uploads
- **Caching** - Redis for performance optimization
- **Clustering** - Multi-core support for production
- **Comprehensive Logging** - Winston-based logging system

## 🛠️ Tech Stack

- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Express.js 5 with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis with ioredis client
- **Validation**: Zod schemas
- **Authentication**: JWT with cookie-based sessions
- **Security**: Helmet, CORS, rate limiting
- **File Uploads**: Multer with size limits
- **Logging**: Winston with file rotation

## 📋 Prerequisites

- [Bun](https://bun.sh) v1.2.5 or higher
- [MongoDB](https://www.mongodb.com/) v6.0 or higher
- [Redis](https://redis.io/) v6.0 or higher
- Node.js v18+ (for migrate-mongo compatibility)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
bun install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
SESSION_SECRET=your-session-secret-min-32-characters
CSRF_SECRET=your-csrf-secret-min-32-characters
```

### 3. Database Setup

```bash
# Run database migrations
bun run migrate:up

# Seed with sample data
bun run seed:all
```

### 4. Start Development Server

```bash
# Start with hot reload
bun run dev

# Or start normally
bun run start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints
```http
POST /auth/register     # User registration
POST /auth/login        # User login
POST /auth/logout       # Logout current session
POST /auth/logout-all   # Logout all sessions
GET  /auth/profile      # Get user profile
PATCH /auth/profile     # Update user profile
POST /auth/refresh-token # Refresh JWT token
```

### Product Endpoints
```http
GET    /products          # Get all products (with filtering)
GET    /products/:id      # Get product by ID
GET    /products/sku/:sku # Get product by SKU
GET    /products/categories # Get all categories
POST   /products          # Create product (vendor/admin)
PUT    /products/:id      # Update product (vendor/admin)
DELETE /products/:id      # Delete product (vendor/admin)
```

### Cart Endpoints
```http
GET    /cart              # Get user's cart
POST   /cart/add          # Add item to cart
PUT    /cart/item/:productId # Update cart item
DELETE /cart/item/:productId # Remove item from cart
DELETE /cart/clear        # Clear entire cart
GET    /cart/validate     # Validate cart items
```

### Order Endpoints
```http
POST   /orders            # Create new order
GET    /orders            # Get user's orders
GET    /orders/:id        # Get order by ID
GET    /orders/number/:orderNumber # Get order by number
PATCH  /orders/:id/cancel # Cancel order
PATCH  /orders/:id/status # Update order status (vendor/admin)
PATCH  /orders/:id/payment # Update payment status (admin)
GET    /orders/stats/overview # Order statistics (admin)
```

### Admin Endpoints
```http
GET    /admin/dashboard   # Dashboard statistics
GET    /admin/users       # Get all users
PATCH  /admin/users/:id/role # Update user role
DELETE /admin/users/:id   # Delete user
GET    /admin/products/stats # Product statistics
GET    /admin/logs        # System logs
```

## 🗄️ Database Schema

### User Model
```typescript
{
  name: string
  email: string (unique)
  password: string (hashed)
  role: 'admin' | 'vendor' | 'customer'
  sessionTokens: string[]
  isEmailVerified: boolean
  timestamps: true
}
```

### Product Model
```typescript
{
  name: string
  description: string
  price: number
  category: string
  stock: number
  images: string[]
  sku: string (unique)
  vendor: ObjectId (ref: User)
  isActive: boolean
  tags: string[]
  weight?: number
  dimensions?: { length, width, height }
  rating: { average, count }
  timestamps: true
}
```

### Order Model
```typescript
{
  userId: ObjectId (ref: User)
  orderNumber: string (auto-generated)
  products: [{ productId, name, price, quantity, sku }]
  totalAmount: number
  subtotal: number
  tax: number
  shipping: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: AddressSchema
  billingAddress: AddressSchema
  timestamps: true
}
```

## 🧪 Sample Data

The application includes comprehensive seeders with sample data:

**Default Users:**
- **Admin**: `admin@ecommerce.com` / `Admin123!@#`
- **Vendor**: `vendor@ecommerce.com` / `Vendor123!@#`
- **Customer**: `customer@ecommerce.com` / `Customer123!@#`

**Sample Products:**
- Electronics (headphones, fitness tracker)
- Accessories (phone cases)
- Clothing (organic t-shirts)
- Home & Garden (water bottles)

## 🛠️ Development Commands

```bash
# Development
bun run dev              # Start with hot reload
bun run build            # Build for production
bun run start            # Start production server

# Database
bun run migrate:up       # Run migrations
bun run migrate:down     # Rollback migrations
bun run migrate:create <name> # Create new migration

# Data Seeding
bun run seed             # Show seeding options
bun run seed:users       # Seed users only
bun run seed:products    # Seed products only
bun run seed:all         # Seed all data
bun run seed:clear       # Clear all data
bun run seed:reset       # Clear and reseed all data

# Testing
bun test                 # Run test suite
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database, Redis, environment configuration
│   │   ├── db.ts        # MongoDB connection
│   │   ├── redis.ts     # Redis connection
│   │   └── env.ts       # Environment variables validation
│   ├── controllers/     # Request handlers
│   │   ├── AuthController.ts
│   │   ├── ProductController.ts
│   │   ├── CartController.ts
│   │   ├── OrderController.ts
│   │   └── AdminController.ts
│   ├── models/          # Database models
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Cart.ts
│   │   ├── Order.ts
│   │   └── Log.ts
│   ├── services/        # Business logic
│   │   ├── AuthService.ts
│   │   ├── ProductService.ts
│   │   ├── CartService.ts
│   │   └── OrderService.ts
│   ├── middleware/      # Custom middleware
│   │   ├── authMiddleware.ts
│   │   ├── roleMiddleware.ts
│   │   ├── rateLimiter.ts
│   │   └── errorMiddleware.ts
│   ├── routes/          # API routes
│   │   ├── authRoutes.ts
│   │   ├── productRoutes.ts
│   │   ├── cartRoutes.ts
│   │   ├── orderRoutes.ts
│   │   ├── adminRoutes.ts
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── logger.ts
│   │   ├── csvParser.ts
│   │   └── cacheHelper.ts
│   ├── database/        # Database management
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── seed.ts
│   ├── app.ts           # Express application setup
│   └── server.ts        # Server entry point with clustering
├── logs/                # Application logs
├── uploads/             # File uploads directory
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── migrate-mongo-config.js # Migration configuration
└── .env.example         # Environment template
```

## 🔒 Security Features

- **Rate Limiting**: Configurable per endpoint
- **CORS Protection**: Configurable origins
- **Helmet Security Headers**: XSS, CSRF, clickjacking protection
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Mongoose ODM
- **Password Security**: bcrypt with 12 rounds
- **Session Management**: Redis-backed JWT sessions
- **File Upload Security**: Size and type restrictions

## 🚀 Production Deployment

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start with clustering
pm2 start src/server.ts --name "ecommerce-api" -i max

# Monitor
pm2 monit

# Logs
pm2 logs ecommerce-api
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-mongo-url
REDIS_URL=redis://your-production-redis-url
JWT_SECRET=your-super-secure-jwt-secret-for-production
SESSION_SECRET=your-super-secure-session-secret-for-production
CSRF_SECRET=your-super-secure-csrf-secret-for-production
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Performance Features

- **Database Indexing**: Optimized queries for all collections
- **Redis Caching**: Product data, categories, user sessions
- **Connection Pooling**: MongoDB and Redis connection optimization
- **Clustering**: Multi-core CPU utilization
- **Compression**: Gzip compression for responses
- **Request Optimization**: Efficient pagination and filtering

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check MongoDB service
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

**Redis Connection Error**
```bash
# Check Redis service
sudo systemctl status redis

# Start Redis
sudo systemctl start redis
```

**Permission Errors**
```bash
# Create necessary directories
mkdir -p logs uploads

# Set permissions
chmod 755 logs uploads
```

**Migration Errors**
```bash
# Check migration status
bun run migrate:status

# Reset migrations (development only)
bun run migrate:down
bun run migrate:up
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation

---

**Built with ❤️ using Bun, Express.js, TypeScript, MongoDB, and Redis**