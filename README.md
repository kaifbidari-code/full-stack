# 🚖 UberClone — Full-Stack Ride-Booking App

A full-stack Uber-like ride-booking application built with **React**, **Node.js**, **Express**, **MongoDB**, and **Socket.IO**. Supports real-time ride tracking, per-kilometer fare calculation, multiple payment modes, driver & rider dashboards, ratings, and trip history.

---

## 📸 Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | Separate JWT-based login/register for Riders & Drivers |
| 🗺️ **Live Map** | OpenStreetMap + Leaflet with real route rendering |
| 📍 **Geocoding** | Nominatim geocoding + OSRM real driving distance |
| 💸 **Fare Calculator** | ₹15/km per kilometer rate, auto-calculated on route |
| 💳 **Payment Modes** | Cash / Card / Wallet selector with confirmation flow |
| ⚡ **Real-time** | Socket.IO for live ride status updates & driver location |
| ⭐ **Ratings** | Riders can rate & review drivers after ride completion |
| 📋 **History** | Full ride history for both Riders and Drivers |
| ✅ **Payment Status** | Paid / Pending badge tracked per ride |

---

## 🛠️ Tech Stack

### Backend
| Package | Purpose |
|---|---|
| `express` | REST API server |
| `mongoose` | MongoDB ODM |
| `socket.io` | Real-time bidirectional events |
| `jsonwebtoken` | JWT authentication |
| `bcryptjs` | Password hashing |
| `dotenv` | Environment config |
| `nodemon` | Dev hot-reload |

### Frontend
| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `react-leaflet` + `leaflet` | Interactive map |
| `leaflet-routing-machine` | Route line rendering |
| `socket.io-client` | Real-time connection |
| `axios` | HTTP requests |
| `react-hot-toast` | Toast notifications |
| `vite` | Build tool & dev server |

---

## 📁 Project Structure

```
uber/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js   # Register / Login
│   │   │   ├── rideController.js   # Ride CRUD + fare + payment
│   │   │   └── driverController.js # Driver availability
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # JWT protect, riderOnly, driverOnly
│   │   ├── models/
│   │   │   ├── User.js             # Rider model
│   │   │   ├── Driver.js           # Driver model
│   │   │   └── Ride.js             # Ride model (incl. paymentMode)
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── rideRoutes.js
│   │   │   └── driverRoutes.js
│   │   ├── socket.js               # Socket.IO event handlers
│   │   └── index.js                # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   ├── pages/
│   │   │   ├── Rider/
│   │   │   │   ├── Dashboard.jsx   # Book ride, map, payment mode
│   │   │   │   ├── History.jsx     # Rider trip history
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   └── Driver/
│   │   │       ├── Dashboard.jsx   # Accept rides, live updates
│   │   │       ├── History.jsx     # Driver trip history
│   │   │       ├── Login.jsx
│   │   │       └── Register.jsx
│   │   ├── services/
│   │   │   ├── api.js              # Axios instance
│   │   │   └── socket.js           # Socket.IO client
│   │   ├── App.jsx                 # Routes
│   │   └── main.jsx
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/kaifbidari-code/full-stack.git
cd full-stack
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/uberclone
JWT_SECRET=your_super_secret_key
```

Start the backend:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend runs on: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file inside `frontend/` (optional, for custom API URL):

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register/rider` | Public | Register a rider |
| POST | `/api/auth/register/driver` | Public | Register a driver |
| POST | `/api/auth/login/rider` | Public | Rider login → JWT |
| POST | `/api/auth/login/driver` | Public | Driver login → JWT |

### Rides
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/rides/estimate` | Rider | Estimate fare by distance |
| POST | `/api/rides` | Rider | Create a new ride |
| GET | `/api/rides/history` | Both | Get ride history |
| GET | `/api/rides/pending` | Driver | Get pending rides |
| PUT | `/api/rides/:id/status` | Driver | Update ride status |
| PUT | `/api/rides/:id/rate` | Rider | Rate a completed ride |
| PUT | `/api/rides/:id/payment` | Rider | Confirm payment |

### Drivers
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/drivers/available` | Rider | List available drivers |

---

## 💳 Payment Mode Flow

```
1. Rider enters pickup & destination
2. Fare auto-calculated → ₹15 × distance (km)
3. Rider selects Payment Mode: 💵 Cash | 💳 Card | 📲 Wallet
4. Ride is booked (paymentMode saved in DB)
5. Driver accepts → completes ride
6. Final fare locked in DB (finalFare = distance × ₹15/km)
7. Rider clicks "Confirm Payment" → paymentStatus = "paid"
8. History shows ✅ Paid or ⏳ Pending badge
```

---

## ⚡ Real-Time Events (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `requestRide` | Rider → Server | New ride request broadcast |
| `rideStatusUpdate` | Server → Rider | Status change (Accepted / Ongoing / Completed) |
| `driverLocationUpdate` | Driver → Server | Driver GPS update |
| `joinRoom` | Both | Join ride-specific room |

---

## 🗺️ Fare Calculation

```
Fare = Distance (km) × ₹15/km

Example:
  Route: Mumbai → Pune (~150 km)
  Fare  = 150 × 15 = ₹2,250
```

Distance is calculated using:
1. **OSRM** (real driving route distance) — primary
2. **Haversine formula** (straight-line) — fallback

---

## 📦 Environment Variables

### Backend (`backend/.env`)
| Variable | Example | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://...` | MongoDB connection string |
| `JWT_SECRET` | `mysecret123` | Secret for JWT signing |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👤 Author

**Kaif Bidari**  
GitHub: [@kaifbidari-code](https://github.com/kaifbidari-code)
