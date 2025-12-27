# 🎫 EventHive — Event Management Server

### EventHive is a **robust, secure, and scalable backend** for a modern event management platform.  
#### It enables users to browse events, book tickets via **Stripe**, and supports **role-based access control** for Admins and Event Managers.

---

## 🚀 Key Features

- 🔐 **Authentication & Authorization**
  - Firebase Admin SDK for secure JWT verification
  - Role-based access (`User`, `Manager`, `Admin`)

- 🎟️ **Event Management**
  - Create, update, approve, and delete events
  - Automatic seat availability tracking

- 💳 **Secure Payments**
  - Stripe Checkout integration
  - Payment verification before booking confirmation

- 🔁 **Smart Refund System**
  - Full or partial refund based on event date
  - Automatic seat restoration on cancellation

- ⚙️ **Concurrency Safe**
  - MongoDB Transactions for booking & cancellation
  - Prevents race conditions on seat count

---

## 🛠️ Tech Stack

| Layer | Technology |
|-----|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | Firebase Admin SDK |
| Payments | Stripe API |
| Env Management | dotenv |

---

## 🏗️ Project Architecture

```text
event-hive-server/
│
├── middlewares/         # JWT, Admin & Manager guards
├── models/              # Mongoose schemas (User, Event, Booking)
├── routes/              # Modular REST APIs
│   ├── userRoutes.js
│   ├── eventRoutes.js
│   └── bookingRoutes.js
│
├── .env                 # Environment variables (git ignored)
├── index.js             # Application entry point
└── package.json         # Dependencies & scripts
```
---

## ⚙️ Installation & Setup

### 1. Clone the repository:
```
git clone https://github.com/Sahidulislam05/EventHive
cd event-hive-server
```
### 2. Install dependencies:
```
npm install
```
### 3. Set up Environment Variables: Create a .env file in the root directory and add the following:
```
PORT=5000
DB_USER=your_db_username
DB_PASS=your_db_password
STRIPE_SECRET_KEY=your_stripe_secret
CLIENT_DOMAIN=http://localhost:5173
FB_SERVICE_KEY=your_base64_encoded_firebase_key
```
### ⚠️ Important:
***FB_SERVICE_KEY must be base64 encoded before storing in .env.***

### 4. Run the server:
```
# Development mode
npm run dev

# Production mode
npm start
```
### 🔌 API Endpoints

#### Authentication

| Method | Endpoint                | Access    | Description         |
| ------ | ----------------------- | --------- | ------------------- |
| POST   | `/users`                | Public    | Register a new user |

#### Events
| Method | Endpoint              | Access          | Description               |
| ------ | --------------------- | --------------- | ------------------------- |
| GET    | `/events`             | Public          | Fetch all approved events |
| POST   | `/events`             | Manager / Admin | Create a new event        |
| DELETE | `/events/:id`         | Admin           | Delete an event           |

#### Bookings & Payments

| Method | Endpoint                   | Access | Description                      |
| ------ | -------------------------- | ------ | -------------------------------- |
| POST   | `/create-checkout-session` | User   | Start Stripe payment             |
| POST   | `/session-status`          | User   | Verify payment & confirm booking |
| GET    | `/bookings/:email`             | User   | Get logged-in user bookings      |
| DELETE | `/bookings/:id`            | User   | Cancel booking & refund          |


### 🔒 Security Middleware
#### This project uses custom middlewares to protect sensitive routes:

* `verifyJWT:` Verifies the Firebase ID token from the request header.

* `verifyAdmin:` Restricts access to Admin-only features.

* `verifyManager:` Ensures only Event Managers can host events.

#### Middleware flow:
```
Request → verifyJWT → verifyRole → Controller
```

### 🧪 Best Practices Followed

-  Modular route structure

-  Clean separation of concerns

-  Secure payment verification

-  Transaction-safe booking logic

-  Production-ready error handling

### 🤝 Contributing
***Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.***

### 📄 License

***This project is licensed under the **MIT License.**
See the license file for details. [MIT License](https://choosealicense.com/licenses/mit)***

### ⭐ Support

**If you find this project helpful, please consider giving it a ⭐ on GitHub.**








