import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// CRITICAL: Always listen strictly on port 3000 for AI Studio environment
const PORT = 3000;

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'vehicle-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Favicon handler to prevent redirect loops or favicon errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Robust session configuration for iframe environments
app.use(session({
  name: 'rental_sess',
  secret: process.env.SESSION_SECRET || 'car-bike-rental-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'none',
    secure: true
  }
}));

// ==========================================
// IN-MEMORY DATA STORE
// ==========================================

const users = [
  {
    id: 'user_admin_01',
    fullName: 'Administrator',
    email: 'admin@gmail.com',
    phone: '9999999999',
    password: bcrypt.hashSync('admin123', 10),
    role: 'ROLE_ADMIN',
    enabled: true
  },
  {
    id: 'user_demo_02',
    fullName: 'John Doe',
    email: 'user@gmail.com',
    phone: '9876543210',
    password: bcrypt.hashSync('user123', 10),
    role: 'ROLE_USER',
    enabled: true
  }
];

const vehicles = [
  {
    id: 'veh_01',
    type: 'CAR',
    company: 'Hyundai',
    model: 'Creta SX (O)',
    vehicleNumber: 'KA01ME4521',
    description: 'Spacious and comfortable SUV with panoramic sunroof and smooth automatic drive.',
    pricePerKm: 14,
    fuelType: 'PETROL',
    seatingCapacity: 5,
    rating: 4.9,
    tripsCount: 148,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    available: true
  },
  {
    id: 'veh_02',
    type: 'CAR',
    company: 'Mahindra',
    model: 'Thar 4x4 Hardtop',
    vehicleNumber: 'MH02CZ8910',
    description: 'Iconic all-terrain off-roader built for rugged adventure and mountain trails.',
    pricePerKm: 18,
    fuelType: 'DIESEL',
    seatingCapacity: 4,
    rating: 4.9,
    tripsCount: 210,
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    available: true
  },
  {
    id: 'veh_03',
    type: 'CAR',
    company: 'Tata',
    model: 'Nexon EV Long Range',
    vehicleNumber: 'DL3CA1299',
    description: 'Eco-friendly electric compact SUV with 450 km range, instant torque, and zero emissions.',
    pricePerKm: 11,
    fuelType: 'ELECTRIC',
    seatingCapacity: 5,
    rating: 4.8,
    tripsCount: 95,
    imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    available: true
  },
  {
    id: 'veh_04',
    type: 'CAR',
    company: 'Maruti Suzuki',
    model: 'Swift ZXi+',
    vehicleNumber: 'KA05NB7744',
    description: 'Agile city hatchback, fuel efficient, effortless parking and peppy performance.',
    pricePerKm: 9,
    fuelType: 'PETROL',
    seatingCapacity: 5,
    rating: 4.7,
    tripsCount: 320,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    available: true
  },
  {
    id: 'veh_05',
    type: 'BIKE',
    company: 'Royal Enfield',
    model: 'Classic 350 Reborn',
    vehicleNumber: 'KA03HQ9912',
    description: 'Timeless retro thumper with comfortable cruising posture and distinct exhaust note.',
    pricePerKm: 6,
    fuelType: 'PETROL',
    seatingCapacity: 2,
    rating: 4.9,
    tripsCount: 412,
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    available: true
  },
  {
    id: 'veh_06',
    type: 'BIKE',
    company: 'KTM',
    model: 'Duke 250 BS6',
    vehicleNumber: 'MH12TR3321',
    description: 'Razor-sharp street fighter with responsive power delivery and WP upside-down forks.',
    pricePerKm: 7,
    fuelType: 'PETROL',
    seatingCapacity: 2,
    rating: 4.8,
    tripsCount: 180,
    imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    available: true
  },
  {
    id: 'veh_07',
    type: 'BIKE',
    company: 'Ather',
    model: '450X Gen 3',
    vehicleNumber: 'KA04EV5566',
    description: 'Smart connected electric scooter with Warp mode, Google Maps navigation and fast charging.',
    pricePerKm: 4,
    fuelType: 'ELECTRIC',
    seatingCapacity: 2,
    rating: 4.9,
    tripsCount: 260,
    imageUrl: 'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=800&q=80',
    available: true
  },
  {
    id: 'veh_08',
    type: 'BIKE',
    company: 'Yamaha',
    model: 'MT-15 V2',
    vehicleNumber: 'TN09BZ1188',
    description: 'Hyper naked motorcycle inspired by the Dark Side of Japan with VVA performance.',
    pricePerKm: 6,
    fuelType: 'PETROL',
    seatingCapacity: 2,
    rating: 4.8,
    tripsCount: 195,
    imageUrl: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=800&q=80',
    available: true
  }
];

const bookings = [
  {
    id: 'bkg_101',
    userId: 'user_demo_02',
    userEmail: 'user@gmail.com',
    userName: 'John Doe',
    userPhone: '9876543210',
    vehicleId: 'veh_01',
    vehicleName: 'Hyundai Creta SX (O)',
    vehicleNumber: 'KA01ME4521',
    vehicleType: 'CAR',
    startDate: '2026-10-10',
    endDate: '2026-10-12',
    estimatedKm: 180,
    pricePerKm: 14,
    subtotal: 2520,
    discountAmount: 252,
    totalAmount: 2268,
    promoCode: 'FIRST10',
    paymentMethod: null,
    status: 'PENDING',
    createdAt: new Date()
  },
  {
    id: 'bkg_102',
    userId: 'user_demo_02',
    userEmail: 'user@gmail.com',
    userName: 'John Doe',
    userPhone: '9876543210',
    vehicleId: 'veh_05',
    vehicleName: 'Royal Enfield Classic 350 Reborn',
    vehicleNumber: 'KA03HQ9912',
    vehicleType: 'BIKE',
    startDate: '2026-10-15',
    endDate: '2026-10-16',
    estimatedKm: 120,
    pricePerKm: 6,
    subtotal: 720,
    discountAmount: 0,
    totalAmount: 720,
    promoCode: null,
    paymentMethod: null,
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 3600000 * 2)
  },
  {
    id: 'bkg_103',
    userId: 'user_demo_02',
    userEmail: 'user@gmail.com',
    userName: 'John Doe',
    userPhone: '9876543210',
    vehicleId: 'veh_03',
    vehicleName: 'Tata Nexon EV Long Range',
    vehicleNumber: 'DL3CA1299',
    vehicleType: 'CAR',
    startDate: '2026-09-25',
    endDate: '2026-09-27',
    estimatedKm: 250,
    pricePerKm: 11,
    subtotal: 2750,
    discountAmount: 0,
    totalAmount: 2750,
    promoCode: null,
    paymentMethod: 'upi',
    status: 'PAID',
    createdAt: new Date(Date.now() - 86400000 * 5)
  }
];

const feedbacks = [
  {
    id: 'fb_01',
    userId: 'user_demo_02',
    userName: 'Ankit Mishra',
    userEmail: 'ankit.m@gmail.com',
    rating: 5,
    tripTime: '2 hours ago',
    vehicleRented: 'Mahindra Thar 4x4',
    category: 'Vehicle Condition & Performance',
    comments: 'Took the Thar on a weekend getaway. The 4x4 suspension handled rough terrain like butter! Plus the 10% first ride discount saved me good money.',
    createdAt: new Date(Date.now() - 3600000 * 2)
  },
  {
    id: 'fb_02',
    userId: 'user_03',
    userName: 'Sneha Kulkarni',
    userEmail: 'sneha.k@gmail.com',
    rating: 5,
    tripTime: '5 hours ago',
    vehicleRented: 'Royal Enfield Classic 350',
    category: 'Booking & Reservation Process',
    comments: 'Super clean bike with helmet provided. Instant approval by admin and smooth UPI payment. Will recommend to all my biker friends!',
    createdAt: new Date(Date.now() - 3600000 * 5)
  },
  {
    id: 'fb_03',
    userId: 'user_04',
    userName: 'Vikram Rajput',
    userEmail: 'vikram.r@gmail.com',
    rating: 5,
    tripTime: 'Yesterday',
    vehicleRented: 'Ather 450X Gen 3',
    category: 'Pricing & Value',
    comments: 'Rented the Ather for quick city commutes. Fast pickup, 100% battery, and transparent per-km rates with zero hidden fees.',
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    id: 'fb_04',
    userId: 'user_05',
    userName: 'Deepa Patel',
    userEmail: 'deepa.p@gmail.com',
    rating: 4.8,
    tripTime: '2 days ago',
    vehicleRented: 'Hyundai Creta SX (O)',
    category: 'Customer Support',
    comments: 'Great family car for our outstation road trip. Clean interiors, AC worked flawlessly, and support team was always responsive.',
    createdAt: new Date(Date.now() - 86400000 * 2)
  }
];

// Persistent Session Recovery (Prevents asking for login again in iframes)
app.use((req, res, next) => {
  if (!req.session.user) {
    const token = req.cookies.rental_auth_user;
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        const matched = users.find(u => u.email === payload.email);
        if (matched) {
          req.session.user = {
            id: matched.id,
            fullName: matched.fullName,
            email: matched.email,
            phone: matched.phone,
            role: matched.role
          };
        }
      } catch (err) {}
    }
  }
  res.locals.currentUser = req.session.user || null;
  next();
});

// Require Auth (Auto-authenticates demo user if accessing directly in preview iframe so it NEVER asks repeatedly)
function requireAuth(req, res, next) {
  if (!req.session.user) {
    // If persistent cookie exists, recover
    const token = req.cookies.rental_auth_user;
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        const matched = users.find(u => u.email === payload.email);
        if (matched) {
          req.session.user = {
            id: matched.id,
            fullName: matched.fullName,
            email: matched.email,
            phone: matched.phone,
            role: matched.role
          };
          return next();
        }
      } catch (e) {}
    }

    // Default seamless login for preview if visiting user dashboard
    const defaultRider = users.find(u => u.role === 'ROLE_USER');
    req.session.user = {
      id: defaultRider.id,
      fullName: defaultRider.fullName,
      email: defaultRider.email,
      phone: defaultRider.phone,
      role: defaultRider.role
    };
    const b64 = Buffer.from(JSON.stringify({ email: defaultRider.email, role: defaultRider.role })).toString('base64');
    res.cookie('rental_auth_user', b64, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'ROLE_ADMIN') {
    return res.redirect('/login');
  }
  next();
}

function isFirstRideEligible(email) {
  const paidOrCompleted = bookings.filter(b => b.userEmail === email && b.status === 'PAID');
  return paidOrCompleted.length === 0;
}

// ==========================================
// 1-CLICK QUICK LOGIN (PREVENTS RE-LOGIN)
// ==========================================

app.get('/quick-login/:role', (req, res) => {
  const isAdm = req.params.role === 'admin';
  const targetUser = users.find(u => isAdm ? u.role === 'ROLE_ADMIN' : u.role === 'ROLE_USER');
  if (targetUser) {
    req.session.user = {
      id: targetUser.id,
      fullName: targetUser.fullName,
      email: targetUser.email,
      phone: targetUser.phone,
      role: targetUser.role
    };
    const b64 = Buffer.from(JSON.stringify({ email: targetUser.email, role: targetUser.role })).toString('base64');
    res.cookie('rental_auth_user', b64, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true
    });
    return res.redirect(isAdm ? '/admin/dashboard' : '/user/dashboard');
  }
  res.redirect('/login');
});

// ==========================================
// PUBLIC & GENERAL NAVIGATION ROUTES
// ==========================================

app.get('/', (req, res) => {
  res.render('index', {
    vehicles: vehicles.filter(v => v.available),
    user: req.session.user || null,
    feedbacks
  });
});

app.get('/vehicles', (req, res) => {
  const activeUser = req.session.user || users.find(u => u.role === 'ROLE_USER');
  const userBookings = bookings.filter(b => b.userEmail === activeUser.email);
  const activeCount = userBookings.filter(b => b.status === 'ACCEPTED' || b.status === 'PAID').length;
  
  res.render('user/dashboard', {
    user: activeUser,
    vehicles: vehicles.filter(v => v.available),
    myBookingsCount: userBookings.length,
    activeBookingsCount: activeCount,
    isFirstRide: isFirstRideEligible(activeUser.email),
    feedbacks,
    feedbackSuccess: false
  });
});

app.get('/dashboard', (req, res) => {
  if (req.session.user && req.session.user.role === 'ROLE_ADMIN') {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/user/dashboard');
});

// ==========================================
// USER SPECIFIC ROUTES
// ==========================================

app.get('/user/dashboard', requireAuth, (req, res) => {
  const userBookings = bookings.filter(b => b.userEmail === req.session.user.email);
  const activeCount = userBookings.filter(b => b.status === 'ACCEPTED' || b.status === 'PAID').length;

  res.render('user/dashboard', {
    user: req.session.user,
    vehicles: vehicles.filter(v => v.available),
    myBookingsCount: userBookings.length,
    activeBookingsCount: activeCount,
    isFirstRide: isFirstRideEligible(req.session.user.email),
    feedbacks,
    feedbackSuccess: req.query.feedbackSuccess === 'true'
  });
});

function renderBookingsPage(req, res) {
  const userBookings = bookings.filter(b => b.userEmail === req.session.user.email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.render('user/bookings', {
    user: req.session.user,
    bookings: userBookings,
    params: req.query
  });
}

app.get('/my-bookings', requireAuth, renderBookingsPage);
app.get('/user/bookings', requireAuth, renderBookingsPage);

function handleDeleteBooking(req, res) {
  const idx = bookings.findIndex(b => b.id === req.params.id && b.userEmail === req.session.user.email);
  if (idx !== -1) {
    bookings.splice(idx, 1);
    return res.redirect('/my-bookings?deleted=true');
  }
  res.redirect('/my-bookings');
}

app.get('/user/bookings/delete/:id', requireAuth, handleDeleteBooking);
app.get('/my-bookings/delete/:id', requireAuth, handleDeleteBooking);

function renderSettingsPage(req, res) {
  const userObj = users.find(u => u.email === req.session.user.email);
  res.render('user/settings', {
    user: userObj || req.session.user,
    params: req.query,
    error: null
  });
}

app.get('/account/settings', requireAuth, renderSettingsPage);
app.get('/user/settings', requireAuth, renderSettingsPage);

function handleUpdateSettings(req, res) {
  const { fullName, phone, newPassword, confirmPassword } = req.body;
  const userObj = users.find(u => u.email === req.session.user.email);

  if (newPassword && newPassword.trim()) {
    if (newPassword !== confirmPassword) {
      return res.render('user/settings', {
        user: userObj || req.session.user,
        params: {},
        error: 'Passwords do not match. Please try again.'
      });
    }
    userObj.password = bcrypt.hashSync(newPassword, 10);
  }

  if (fullName && fullName.trim()) userObj.fullName = fullName.trim();
  if (phone && phone.trim()) userObj.phone = phone.trim();

  req.session.user.fullName = userObj.fullName;
  req.session.user.phone = userObj.phone;

  res.redirect('/account/settings?saved=true');
}

app.post('/account/settings', requireAuth, handleUpdateSettings);
app.post('/user/settings', requireAuth, handleUpdateSettings);

// User Feedback submission
app.post('/user/feedback', requireAuth, (req, res) => {
  const { rating, category, comments } = req.body;
  if (comments && comments.trim()) {
    feedbacks.unshift({
      id: 'fb_' + Date.now(),
      userId: req.session.user.id,
      userName: req.session.user.fullName || req.session.user.email,
      userEmail: req.session.user.email,
      rating: parseFloat(rating) || 5,
      tripTime: 'Just now',
      vehicleRented: 'Verified Rental Trip',
      category: category || 'General',
      comments: comments.trim(),
      createdAt: new Date()
    });
  }
  res.redirect('/user/dashboard?feedbackSuccess=true#feedback-section');
});

// ==========================================
// AUTHENTICATION
// ==========================================

app.get('/login', (req, res) => {
  if (req.session.user && !req.query.logout) {
    return req.session.user.role === 'ROLE_ADMIN'
      ? res.redirect('/admin/dashboard')
      : res.redirect('/user/dashboard');
  }
  res.render('login', {
    error: req.query.error ? 'Invalid email or password. Please try again.' : null,
    success: req.query.registered ? 'Registration successful! You can now sign in.' : null
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (username || '').trim().toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.redirect('/login?error=true');
  }

  req.session.user = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role
  };

  // Persistent cookie for iframe cross-origin requests
  const b64 = Buffer.from(JSON.stringify({ email: user.email, role: user.role })).toString('base64');
  res.cookie('rental_auth_user', b64, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: 'none',
    secure: true
  });

  if (user.role === 'ROLE_ADMIN') {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/user/dashboard');
});

app.get('/loginSuccess', (req, res) => {
  if (req.session.user && req.session.user.role === 'ROLE_ADMIN') {
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/user/dashboard');
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.render('register', {
      error: 'An account with this email address already exists.',
      formData: { fullName, email, phone }
    });
  }

  const newUser = {
    id: 'user_' + Date.now(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    password: bcrypt.hashSync(password, 10),
    role: 'ROLE_USER',
    enabled: true
  };
  users.push(newUser);

  res.redirect('/login?registered=true');
});

app.get('/logout', (req, res) => {
  res.clearCookie('rental_auth_user', { sameSite: 'none', secure: true });
  req.session.destroy(() => {
    res.redirect('/login?logout=true');
  });
});

app.post('/logout', (req, res) => {
  res.clearCookie('rental_auth_user', { sameSite: 'none', secure: true });
  req.session.destroy(() => {
    res.redirect('/login?logout=true');
  });
});

// ==========================================
// BOOKING & PAYMENT FLOW (10% DISCOUNT)
// ==========================================

app.get('/booking/:id', requireAuth, (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) {
    return res.redirect('/user/dashboard');
  }
  const isFirstRide = isFirstRideEligible(req.session.user.email);
  res.render('booking/payment', {
    vehicle,
    user: req.session.user,
    isFirstRide
  });
});

app.post('/booking/:id', requireAuth, (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) {
    return res.redirect('/user/dashboard');
  }

  const { startDate, endDate, estimatedKm, promoCode } = req.body;
  const km = parseFloat(estimatedKm) || 0;
  const rate = vehicle.pricePerKm || 0;
  const subtotal = rate * km;

  // 10% Discount for First Ride or promoCode FIRST10
  const isFirst = isFirstRideEligible(req.session.user.email);
  const appliesDiscount = isFirst || (promoCode && promoCode.trim().toUpperCase() === 'FIRST10');
  const discountAmount = appliesDiscount ? Math.round(subtotal * 0.10) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const newBooking = {
    id: 'bkg_' + Date.now(),
    userId: req.session.user.id,
    userEmail: req.session.user.email,
    userName: req.session.user.fullName || req.session.user.email,
    userPhone: req.session.user.phone || '',
    vehicleId: vehicle.id,
    vehicleName: vehicle.company + ' ' + vehicle.model,
    vehicleNumber: vehicle.vehicleNumber,
    vehicleType: vehicle.type,
    startDate,
    endDate,
    estimatedKm: km,
    pricePerKm: rate,
    subtotal,
    discountAmount,
    totalAmount: finalTotal,
    promoCode: appliesDiscount ? 'FIRST10' : null,
    paymentMethod: null,
    status: 'PENDING',
    createdAt: new Date()
  };

  bookings.push(newBooking);
  res.redirect('/my-bookings?requested=true');
});

app.get('/booking/pay/:bookingId', requireAuth, (req, res) => {
  const booking = bookings.find(b => b.id === req.params.bookingId);
  if (!booking || booking.userEmail !== req.session.user.email || booking.status !== 'ACCEPTED') {
    return res.redirect('/my-bookings');
  }
  res.render('booking/pay', {
    booking,
    user: req.session.user
  });
});

app.post('/booking/pay/:bookingId', requireAuth, (req, res) => {
  const booking = bookings.find(b => b.id === req.params.bookingId);
  if (booking && booking.userEmail === req.session.user.email && booking.status === 'ACCEPTED') {
    booking.status = 'PAID';
    booking.paymentMethod = req.body.paymentMethod || 'upi';
  }
  res.redirect('/my-bookings?paid=true');
});

// ==========================================
// ADMIN DASHBOARD & CONTROLS
// ==========================================

app.get('/admin', requireAdmin, (req, res) => {
  res.redirect('/admin/dashboard');
});

app.get('/admin/dashboard', requireAdmin, (req, res) => {
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  res.render('admin/dashboard', {
    pendingBookings: pendingCount
  });
});

app.get('/admin/vehicles', requireAdmin, (req, res) => {
  res.render('admin/vehicles', {
    vehicles
  });
});

app.get('/admin/vehicles/add', requireAdmin, (req, res) => {
  res.render('admin/add-vehicle');
});

app.post('/admin/vehicles/save', requireAdmin, upload.single('imageFile'), (req, res) => {
  const { type, fuelType, company, model, vehicleNumber, seatingCapacity, pricePerKm, available, description, imageUrl } = req.body;

  let finalImg = imageUrl || '';
  if (req.file) {
    finalImg = '/uploads/' + req.file.filename;
  }

  const newVehicle = {
    id: 'veh_' + Date.now(),
    type: type || 'CAR',
    fuelType: fuelType || 'PETROL',
    company: company.trim(),
    model: model.trim(),
    vehicleNumber: vehicleNumber.trim().toUpperCase(),
    seatingCapacity: parseInt(seatingCapacity) || 4,
    pricePerKm: parseFloat(pricePerKm) || 10,
    rating: 5.0,
    tripsCount: 0,
    available: available === 'true',
    description: description ? description.trim() : '',
    imageUrl: finalImg
  };

  vehicles.push(newVehicle);
  res.redirect('/admin/vehicles');
});

app.get('/admin/vehicles/edit/:id', requireAdmin, (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) {
    return res.redirect('/admin/vehicles');
  }
  res.render('admin/edit-vehicle', { vehicle });
});

app.post('/admin/vehicles/update', requireAdmin, upload.single('imageFile'), (req, res) => {
  const { id, type, fuelType, company, model, vehicleNumber, seatingCapacity, pricePerKm, available, description, imageUrl } = req.body;
  const vehicle = vehicles.find(v => v.id === id);

  if (vehicle) {
    vehicle.type = type || vehicle.type;
    vehicle.fuelType = fuelType || vehicle.fuelType;
    vehicle.company = company ? company.trim() : vehicle.company;
    vehicle.model = model ? model.trim() : vehicle.model;
    vehicle.vehicleNumber = vehicleNumber ? vehicleNumber.trim().toUpperCase() : vehicle.vehicleNumber;
    vehicle.seatingCapacity = parseInt(seatingCapacity) || vehicle.seatingCapacity;
    vehicle.pricePerKm = parseFloat(pricePerKm) || vehicle.pricePerKm;
    vehicle.available = available === 'true';
    vehicle.description = description !== undefined ? description.trim() : vehicle.description;

    if (req.file) {
      vehicle.imageUrl = '/uploads/' + req.file.filename;
    } else if (imageUrl !== undefined) {
      vehicle.imageUrl = imageUrl.trim();
    }
  }

  res.redirect('/admin/vehicles');
});

app.get('/admin/vehicles/delete/:id', requireAdmin, (req, res) => {
  const idx = vehicles.findIndex(v => v.id === req.params.id);
  if (idx !== -1) {
    vehicles.splice(idx, 1);
  }
  res.redirect('/admin/vehicles');
});

app.get('/admin/vehicles/clear', requireAdmin, (req, res) => {
  vehicles.length = 0;
  res.redirect('/admin/vehicles');
});

app.get('/admin/users', requireAdmin, (req, res) => {
  res.render('admin/users', { users });
});

app.get('/admin/customers', requireAdmin, (req, res) => {
  res.redirect('/admin/users');
});

app.get('/admin/users/delete/:id', requireAdmin, (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx !== -1 && users[idx].email !== 'admin@gmail.com') {
    users.splice(idx, 1);
  }
  res.redirect('/admin/users');
});

app.get('/admin/bookings', requireAdmin, (req, res) => {
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  res.render('admin/bookings', {
    bookings: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    pendingCount
  });
});

app.get('/admin/bookings/accept/:id', requireAdmin, (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (booking) {
    booking.status = 'ACCEPTED';
  }
  res.redirect('/admin/bookings');
});

app.get('/admin/bookings/reject/:id', requireAdmin, (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (booking) {
    booking.status = 'REJECTED';
  }
  res.redirect('/admin/bookings');
});

app.get('/admin/bookings/delete/:id', requireAdmin, (req, res) => {
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx !== -1) {
    bookings.splice(idx, 1);
  }
  res.redirect('/admin/bookings');
});

app.get('/admin/feedbacks', requireAdmin, (req, res) => {
  res.render('admin/feedbacks', { feedbacks });
});

app.get('/admin/feedbacks/delete/:id', requireAdmin, (req, res) => {
  const idx = feedbacks.findIndex(f => f.id === req.params.id);
  if (idx !== -1) {
    feedbacks.splice(idx, 1);
  }
  res.redirect('/admin/feedbacks');
});

// Explicit error handler for /error
app.get('/error', (req, res) => {
  res.redirect('/user/dashboard');
});

// Fallback: Never display Whitelabel or broken 404
app.use((req, res) => {
  res.redirect('/user/dashboard');
});

// Start Server strictly on port 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Car & Bike Rental server running on http://0.0.0.0:${PORT}`);
});
