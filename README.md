# HeyU 禾屿 - Nail Salon Booking System

A complete nail salon booking management system with customer booking flow and admin panel.

## Tech Stack

### Frontend

- **React** - Frontend framework
- **React Router DOM** - Page routing
- **Vite** - Build tool
- **CSS Modules** - Style management

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework (migrated to Vercel Serverless Functions)
- **Vercel KV (Upstash Redis)** - Database
- **Nodemailer** - Email service

## Project Structure

```
HeyU_Reservation_System/
├── frontend/                 # Frontend project
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   │   ├── Header.jsx        # Navigation header
│   │   │   ├── Button.jsx        # Generic button
│   │   │   └── Calendar.jsx      # Calendar component
│   │   ├── pages/                # Page components
│   │   │   ├── LandingPage.jsx   # Landing page
│   │   │   ├── BookingPage.jsx   # Service selection page
│   │   │   ├── TimeSelectionPage.jsx  # Time selection page
│   │   │   ├── CustomerInfoPage.jsx   # Customer info confirmation page
│   │   │   ├── SuccessPage.jsx        # Booking success page
│   │   │   └── AdminPage.jsx          # Admin panel
│   │   ├── data/                 # Data files
│   │   │   └── services.js       # Service data
│   │   ├── utils/                # Utility functions
│   │   │   └── emailService.js   # Email service
│   │   ├── styles/               # Style files
│   │   │   └── global.css        # Global styles
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry file
│   ├── public/                  # Static assets
│   ├── index.html               # HTML entry
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite config
│   └── eslint.config.js         # ESLint config
├── backend/                    # Backend project
│   ├── api/                     # Vercel serverless functions
│   ├── utils/                    # Utility functions
│   ├── data/                     # Data files
│   └── package.json              # Backend dependencies
└── README.md                   # Project documentation
```

## Features

### Customer Booking Flow

#### 1. Landing Page

- Brand introduction and welcome message
- Bilingual content (Chinese/English)
- Elegant visual design
- Responsive layout

#### 2. Service Selection Page (Booking Page)

- Hand manicure service list
- Display by category (Basic Nails, Extension, Removal)
- Service details (duration, price, description)
- Bilingual display (Chinese/English)
- Card-based layout

#### 3. Time Selection Page (TimeSelectionPage)

- Calendar date selection
- Time slot selection (9:00 AM - 6:00 PM, 30-minute intervals)
- Display available time slots
- Booking summary preview
- Responsive design with fixed bottom bar on mobile

#### 4. Customer Info Confirmation Page (CustomerInfoPage)

- Customer information form
  - Name (required)
  - Phone number (required)
  - Email address (required)
  - WeChat ID/Name (optional)
- Form validation
- Booking summary
- Breadcrumb navigation

#### 5. Booking Success Page (SuccessPage)

- Booking confirmation message
- Booking details display
- Email confirmation notification

### Admin Panel (AdminPage)

#### 1. Service Management

- View all services
- Add new service
- Edit existing service
- Delete service
- Organize by category

#### 2. Date Management

- Calendar date selection
- Block entire date
- Block specific time slots
- View blocked dates and times list
- Unblock functionality

#### 3. Booking Management

- Calendar view showing all bookings
- View booking details by date
- Display customer information (name, phone, email, WeChat)
- Display service information and price
- Booking status management

## Design Features

- **Clean & Modern**: Generous whitespace, clear hierarchy
- **Elegant Typography**: Uses Playfair Display for headings
- **Soft Color Palette**: Gradient background (pink-gold tones), dark text, gold accents
- **Consistent Style**: All pages share the same navigation bar and design language
- **Responsive Design**: Perfect adaptation for desktop and mobile devices
- **Bilingual Support**: All UI text provides Chinese/English translations

## Page Routes

- `/` 
- `/booking` 
- `/booking/time` 
- `/booking/confirm` 
- `/booking/success` 
- `/admin` 

## Development

### Frontend Development

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Start Development Server

```bash
cd frontend
npm run dev
```

#### Build Production Version

```bash
cd frontend
npm run build
```

#### Preview Production Build

```bash
cd frontend
npm run preview
```

### Backend Development

#### Install Dependencies

```bash
cd backend
npm install
```

#### Start Development Server

```bash
cd backend
npm run dev
```

#### Deploy to Vercel

The backend is configured as Vercel Serverless Functions. See `backend/VERCEL_DEPLOY.md` for deployment instructions.

## Key Components

### Calendar Component

Reusable calendar component that supports:

- Date selection
- Blocked date display
- Booking count display (with badge)
- Minimum date restriction
- Automatic disabling of past dates

### Data Management

- Service data stored in Redis (Vercel KV)
- Supports service categories, prices, duration, descriptions
- Supports add-on service markers

### Email Service

- Email sending via Nodemailer (Gmail SMTP)
- Complete booking confirmation email template
- Includes all booking details and customer information

## Notes

- Backend uses Vercel Serverless Functions for deployment
- Data is persisted in Redis (Vercel KV / Upstash Redis)
- Email sending is configured via Gmail SMTP
- Project is separated into frontend (`frontend/`) and backend (`backend/`) directories for easier development
