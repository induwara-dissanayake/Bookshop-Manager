# 📚 Bookshop Manager

A modern bookshop management system built with Next.js 14, TypeScript, and PostgreSQL.

## 🚀 Features

- **📖 Book Management**: Add, edit, delete, and search books with case-insensitive search
- **👥 Author Management**: Manage authors and their books
- **🫂 Customer Management**: Handle customer information and registration
- **📋 Order Processing**: Create and manage book orders with automatic payment calculation
- **💰 Finance Dashboard**: Track daily/monthly revenue and sales statistics
- **📊 Reports**: Generate and export Excel reports for books, orders, and customers
- **🔍 Advanced Search**: Case-insensitive search across all entities
- **⚡ Performance Optimized**: Cached queries and optimized database operations

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: Custom admin authentication
- **Reports**: ExcelJS for Excel export functionality

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we recommend Neon for easy setup)

## 🚀 Local Development

1. **Clone the repository**:

   ```bash
   git clone <your-repo-url>
   cd bookshop-manager
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Copy `.env.example` to `.env` and update the values:

   ```env
   DATABASE_URL="your_postgresql_connection_string"
   ADMIN_USERNAME="your_admin_username"
   ADMIN_PASSWORD="your_admin_password"
   NEXTAUTH_SECRET="your_32_character_secret_key_here"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your_secret_key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**:

   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to `http://localhost:3000`

## 🌐 Deployment on Vercel

This project is optimized for Vercel deployment. See `DEPLOYMENT.md` for detailed deployment instructions.

## 📊 Database Schema

The system uses the following main entities:

- **Books**: Book information with authors, pricing, and inventory
- **Authors**: Author details and their books
- **Customers**: Customer registration and contact information
- **Orders**: Book orders with automatic payment calculation
- **Payments**: Payment tracking and financial records

## 🔐 Authentication

Default admin credentials:

- **Username**: Set via `ADMIN_USERNAME` environment variable
- **Password**: Set via `ADMIN_PASSWORD` environment variable

## 📈 Payment System

The system uses a day-based pricing model:

- **Days 1-14**: Rs. 50 per book
- **Days 15-21**: Rs. 80 per book
- **Days 22+**: Rs. 50 + Rs. 30 per additional week

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please open an issue in the repository.
