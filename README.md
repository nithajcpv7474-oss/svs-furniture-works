# 🏭 SVS Furniture Works ERP

![SVS ERP Login](frontend/public/logo.png)

A full-stack, enterprise-grade Order Specification Sheet System built exclusively for **Sri Venkata Sai Furniture Works**. This ERP manages custom orders, production pipelines, inventory, and deliveries all through a highly secure, role-based platform.

## 🔗 Live Demo
* **Frontend Application:** [https://svs-furniture-works.vercel.app](https://svs-furniture-works.vercel.app) *(Update this if Vercel gave you a different link)*
* **Backend API:** [https://svs-furniture-works.onrender.com](https://svs-furniture-works.onrender.com)
* **GitHub Repository:** [https://github.com/nithajcpv7474-oss/svs-furniture-works](https://github.com/nithajcpv7474-oss/svs-furniture-works)

## ✨ Core Features
* 🔐 **Secure Role-Based Authentication:** Distinct access levels for Admins, Managers, and Staff.
* 📦 **Order Management:** Create and track custom furniture orders with detailed specification sheets.
* 🏗️ **Production Kanban:** Visual drag-and-drop production pipeline tracking.
* 📋 **Inventory Control:** Real-time material tracking and stock movement logs.
* 🚚 **Delivery Logistics:** Vehicle management, driver assignments, and delivery scheduling.
* 📊 **Enterprise Reporting:** Revenue analytics, material consumption charts, and system audit trails.

## 🛠️ Tech Stack
**Frontend:**
* React (Vite)
* Tailwind CSS (Enterprise Glassmorphism UI)
* Framer Motion (Animations)
* Lucide React (Icons)
* Recharts (Analytics)

**Backend:**
* Node.js & Express.js
* Prisma ORM
* PostgreSQL (Hosted on Neon)
* JSON Web Tokens (Stateless Auth)

## 🚀 Installation & Local Development

### Prerequisites
* Node.js (v18+)
* PostgreSQL (Running locally or via cloud)

### 1. Clone the repository
```bash
git clone https://github.com/nithajcpv7474-oss/svs-furniture-works.git
cd svs-furniture-works
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/furniture_db?schema=public"
PORT=5005
JWT_SECRET="your_local_secret_key"
NODE_ENV="development"
```
Initialize the database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
*(Optional)* Create a `.env.local` file in the `frontend` directory if your backend runs on a different port:
```env
VITE_API_URL="http://localhost:5005/api"
```
Start the development server:
```bash
npm run dev
```

## 🔒 Environment Variables
To deploy this project to production, you will need to configure the following environment variables on your hosting platforms:

**Backend (Render):**
* `DATABASE_URL` (PostgreSQL Connection String)
* `JWT_SECRET` (Secure random string)
* `PORT` (5005)
* `NODE_ENV` (production)

**Frontend (Vercel):**
* `VITE_API_URL` (https://svs-furniture-works.onrender.com/api)

---
*Developed for SVS Furniture Works • 2026*
