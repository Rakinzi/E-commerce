# E-Commerce Application 🛒

A full-stack MERN e-commerce platform with role-based authentication, product management, and a modern React frontend.

## 🚀 Quick Start Guide

### Prerequisites

Before running this project, ensure you have the following installed:

- **Bun** (JavaScript runtime and package manager) - [Install Bun](https://bun.sh/)
- **MongoDB** (Database) - [Install MongoDB](https://docs.mongodb.com/manual/installation/) or use [MongoDB Atlas](https://cloud.mongodb.com/)
- **Git** (Version control)

### Project Structure

```
Ecommerce App/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Express.js + TypeScript + Bun
└── README.md         # This file
```

## 🔧 Development Setup

### 1. Clone & Navigate

```bash
cd "C:\Users\User\Desktop\Ecommerce App"
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
bun install

# Environment variables are already configured!
# The .env file is already provided with all necessary settings
```

**Note**: The `.env` file is already configured in the `backend` directory with all necessary environment variables including:
- MongoDB connection settings
- JWT authentication secrets
- CORS configuration for frontend
- Email service settings
- File upload configurations
- Rate limiting and security settings

No manual `.env` setup required - just run the commands below!

### 3. Database Setup & Seeding

```bash
# Make sure MongoDB is running, then seed the database
bun run seed:all
```

This will create:
- **Permissions** (admin, vendor, customer roles)
- **Sample Users** (see credentials below)
- **Sample Products** (for testing)

### 4. Start Backend Server

```bash
# Start the backend server (runs on http://localhost:3000)
bun run dev
```

The backend will automatically restart when you make changes.

### 5. Frontend Setup

Open a new terminal window/tab:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
bun install

# Start the frontend development server
bun run dev
```

The frontend will run on **http://localhost:5173**

## 🔐 Demo Users (MVP Testing)

**Important**: This is an MVP, so use these pre-seeded user accounts for testing:

### Admin Account
- **Email**: `admin@ecommerce.com`
- **Password**: `Admin123!@#`
- **Role**: Administrator (full platform access)

### Vendor Account
- **Email**: `vendor@ecommerce.com`
- **Password**: `Vendor123!@#`
- **Role**: Vendor (can manage own products)

### Customer Account
- **Email**: `customer@ecommerce.com`  
- **Password**: `Customer123!@#`
- **Role**: Customer (can browse and purchase)

## 🎯 Role-Based Navigation Guide

### 🔴 Admin User (`admin@ecommerce.com`)
After logging in, you'll have access to:
- **Dashboard**: `/admin` - Platform analytics and overview
- **User Management**: Manage all users, roles, and permissions
- **Product Oversight**: View and moderate all vendor products
- **Order Management**: Monitor all orders across the platform
- **System Settings**: Configure platform-wide settings
- **Analytics**: View sales reports and platform metrics

**Where to start**: Navigate to `/admin` or click "Admin Dashboard" in the navigation menu

### 🟡 Vendor User (`vendor@ecommerce.com`)
After logging in, you'll have access to:
- **Vendor Dashboard**: `/vendor` - Your store analytics and overview
- **Product Management**: `/vendor/products` - Add, edit, delete your products
- **CSV Bulk Import**: Upload multiple products using the provided `test-products.csv` file
- **Bulk Image Upload**: Add images to multiple products at once after CSV import
- **Inventory**: Track stock levels and product availability
- **Orders**: `/vendor/orders` - View orders for your products
- **Store Settings**: Configure your store information
- **Sales Analytics**: Track your individual store performance

**Where to start**: Navigate to `/vendor` or click "Vendor Dashboard" in the navigation menu

#### 📦 **Bulk Product Management (Required MVP Feature)**
1. **CSV Import**: Use the included `test-products.csv` file to quickly populate your store:
   - Go to `/vendor/products`
   - Click "Import from CSV" 
   - Upload the `test-products.csv` file from the project root
   - This will create 10+ sample products instantly

2. **Bulk Image Upload**: After importing products via CSV:
   - Click "Bulk Image Upload" in the vendor dashboard
   - Select multiple images for your imported products
   - The system will automatically assign images to products

### 🟢 Customer User (`customer@ecommerce.com`)
After logging in, you'll have access to:
- **Product Catalog**: `/products` - Browse all available products
- **Categories**: `/categories` - Shop by product categories
- **Shopping Cart**: `/cart` - Review items before checkout
- **Order History**: `/orders` - Track your past and current orders
- **Profile**: `/profile` - Manage account settings and addresses
- **Wishlist**: Save products for later purchase

**Where to start**: Navigate to `/products` or use the main navigation to browse categories

## 🎯 Quick Testing Workflow

1. **Open your browser** and go to `http://localhost:5173`
2. **Login** with any demo account above
3. **Check the navigation menu** - it will show role-specific options
4. **Follow the role-specific paths** outlined above
5. **Test key features** for each role to see the complete system

## 📁 Key Features

- **Role-Based Authentication**: Admin, Vendor, Customer roles
- **Product Management**: CRUD operations, image uploads, categories
- **CSV Bulk Import/Export**: Import products from CSV files (required MVP feature)
- **Bulk Image Upload**: Upload multiple images for products at once
- **Shopping Cart**: Add/remove items, quantity management
- **Order Management**: Place orders, track status
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: React Query for data synchronization

### 📄 **Test Data Files**
The project includes sample data files for testing:
- **`test-products.csv`**: Contains 10+ sample products ready for bulk import
  - Categories: Paint & Decoration, Building Materials, Tools & Equipment
  - Complete product data including SKUs, pricing, and descriptions
  - Use this file to quickly populate your vendor store for testing

## 🛠️ Available Scripts

### Backend (`/backend`)
```bash
bun run dev          # Start development server with hot reload
bun run start        # Start production server
bun run build        # Build for production
bun run test         # Run tests

# Database seeding commands
bun run seed:all           # Seed everything (permissions, users, products)
bun run seed:users         # Seed users only
bun run seed:products      # Seed products only
bun run seed:permissions   # Seed roles/permissions only
bun run seed:clear         # Clear all data
```

### Frontend (`/frontend`)
```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run preview      # Preview production build
bun run lint         # Run ESLint
```

## 🔧 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite 7** (build tool)
- **Tailwind CSS v4** (styling)
- **shadcn/ui** (UI components)
- **React Query** (data fetching)
- **React Router** (navigation)
- **Framer Motion** (animations)

### Backend
- **Bun** (runtime & package manager)
- **Express.js 5** (web framework)
- **TypeScript** (type safety)
- **MongoDB** with **Mongoose** (database)
- **JWT** (authentication)
- **bcrypt** (password hashing)
- **Winston** (logging)

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot connect to database"**
   - Ensure MongoDB is running
   - Check your `MONGODB_URI` in `.env`
   - For local MongoDB: `mongodb://localhost:27017/ecommerce_db`

2. **"Port already in use"**
   - Backend default: `3000` 
   - Frontend default: `5173`
   - Kill existing processes or change ports in config

3. **"bun: command not found"**
   - Install Bun: `curl -fsSL https://bun.sh/install | bash`
   - Restart your terminal

4. **CORS errors**
   - Ensure `FRONTEND_URL=http://localhost:5173` in backend `.env`
   - Check that both servers are running

### Reset Everything

If you encounter issues, you can reset the database:

```bash
cd backend
bun run seed:reset  # Clears all data and reseeds
```

## 📝 Development Notes

- This is an **MVP (Minimum Viable Product)** - use seeded users for testing
- Images are served from `/frontend/public/images/` (local assets)
- Authentication uses JWT with HTTP-only cookies
- All API endpoints are prefixed with `/api/v1/`
- Frontend uses React Query for caching and state management

## 🤝 Contributing

1. Follow the code style defined in ESLint configs
2. Use the seeded users for testing features
3. Refer to `CLAUDE.md` for development guidelines
4. Test both frontend and backend before committing changes

## 📄 License

This project is private and for development purposes.

---

