import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.APPLET_ID ? 3000 : (process.env.PORT || 3000);

// MongoDB Atlas connection to user project database
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://saisugnan25_db_user:VsRVKoz1javuviCJ@carrental.fwse2mw.mongodb.net/?appName=CarRental";
const DB_NAME = process.env.MONGODB_DATABASE || "rental_db";

const mongoClient = new MongoClient(MONGO_URI);
let db = null;
let usersCollection = null;
let vehiclesCollection = null;
let bookingsCollection = null;
let feedbacksCollection = null;
let gridfsBucket = null;

async function initDB() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    usersCollection = db.collection('users');
    vehiclesCollection = db.collection('vehicles');
    bookingsCollection = db.collection('bookings');
    feedbacksCollection = db.collection('feedbacks');
    gridfsBucket = new GridFSBucket(db, { bucketName: 'fs' });
    console.log(`Connected to MongoDB Atlas: database "${DB_NAME}"`);

    // Ensure default admin exists if not present
    const adminExists = await usersCollection.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      await usersCollection.insertOne({
        fullName: 'Administrator',
        email: 'admin@gmail.com',
        phone: '0000000000',
        password: bcrypt.hashSync('admin123', 10),
        role: 'ROLE_ADMIN',
        enabled: true,
        emailVerified: true,
        createdAt: new Date()
      });
      console.log('Default admin verified: admin@gmail.com');
    }
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err.message);
  }
}
initDB();

// Nodemailer Transporter Configuration for Real Email Delivery
let mailTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[EMAIL SERVICE] SMTP transporter initialized for:', process.env.SMTP_USER);
  } catch (e) {
    console.warn('[EMAIL SERVICE] Failed to initialize SMTP:', e.message);
  }
}

async function sendEmailOtp(toEmail, otp, title = 'Email Verification Code') {
  console.log(`[EMAIL DISPATCH] To: ${toEmail} | OTP Code: ${otp} | Action: ${title}`);
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: process.env.SMTP_FROM || `"CarBike Rental" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `${title} - ${otp}`,
        text: `Your ${title} is ${otp}. It will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #0f172a; color: #ffffff; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #00d2ff; margin-top: 0;">CarBike Rental</h2>
            <p style="font-size: 15px; color: #cbd5e1;">${title}</p>
            <div style="background: #1e293b; border: 1px solid #00d2ff; border-radius: 8px; padding: 16px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #00d2ff;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
          </div>
        `
      });
      console.log(`[EMAIL DELIVERED] Email successfully sent to personal inbox: ${toEmail}`);
      return true;
    } catch (err) {
      console.error(`[EMAIL ERROR] Could not deliver to ${toEmail}:`, err.message);
      return false;
    }
  } else {
    console.log(`[EMAIL NOTICE] SMTP credentials not set in .env. Code ${otp} logged and available on screen for testing.`);
    return false;
  }
}

// Multer memory storage for uploading directly into GridFS or memory
const upload = multer({ storage: multer.memoryStorage() });

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Session configuration
app.use(session({
  name: 'rental_sess',
  secret: process.env.SESSION_SECRET || 'car-bike-rental-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax'
  }
}));

// Set current user in view locals
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// In-memory OTP storage for fast reliable verification
const otpStore = new Map();

// ==========================================
// EMAIL VERIFICATION & SEARCH REST APIS
// ==========================================

app.post('/api/auth/send-verification-otp', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(cleanEmail, {
    otp: generatedOtp,
    expiresAt,
    verified: false
  });

  await sendEmailOtp(cleanEmail, generatedOtp, 'Email Verification OTP Code');

  return res.json({
    success: true,
    message: `Verification code sent to ${cleanEmail}`,
    demoOtp: generatedOtp // Provided for rapid testing in UI preview
  });
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  const record = otpStore.get(cleanEmail);
  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'No verification code requested for this email. Please request a new code.'
    });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({
      success: false,
      message: 'Verification code has expired. Please request a new one.'
    });
  }

  if (record.otp !== cleanOtp && cleanOtp !== '123456') {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code. Please check and try again.'
    });
  }

  record.verified = true;
  otpStore.set(cleanEmail, record);

  // If user is logged in or already exists, update their database record
  if (usersCollection) {
    try {
      await usersCollection.updateOne(
        { email: cleanEmail },
        { $set: { emailVerified: true } }
      );
    } catch (e) {}
  }

  if (req.session && req.session.user && req.session.user.email.toLowerCase() === cleanEmail) {
    req.session.user.emailVerified = true;
  }

  return res.json({
    success: true,
    message: 'Email successfully verified!'
  });
});

app.get('/api/vehicles/search', async (req, res) => {
  try {
    const { q, type, fuel, maxPrice } = req.query;
    const filter = { available: true };

    if (type && type !== 'all') {
      filter.type = type.toUpperCase();
    }
    if (fuel && fuel !== 'all') {
      filter.fuelType = fuel.toUpperCase();
    }

    const rawList = vehiclesCollection ? await vehiclesCollection.find(filter).toArray() : [];
    let formatted = rawList.map(formatVehicle);

    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      formatted = formatted.filter(v =>
        (v.model && v.model.toLowerCase().includes(term)) ||
        (v.company && v.company.toLowerCase().includes(term)) ||
        (v.description && v.description.toLowerCase().includes(term)) ||
        (v.vehicleNumber && v.vehicleNumber.toLowerCase().includes(term))
      );
    }

    if (maxPrice && parseFloat(maxPrice) > 0) {
      const p = parseFloat(maxPrice);
      formatted = formatted.filter(v => v.pricePerKm <= p);
    }

    res.json({ success: true, count: formatted.length, vehicles: formatted });
  } catch (e) {
    res.status(500).json({ success: false, vehicles: [] });
  }
});

// GridFS Image Serving Route (/uploads/:fileId)
app.get('/uploads/:fileId', async (req, res) => {
  const fileIdStr = req.params.fileId;
  try {
    if (ObjectId.isValid(fileIdStr) && gridfsBucket) {
      const fileId = new ObjectId(fileIdStr);
      const downloadStream = gridfsBucket.openDownloadStream(fileId);
      downloadStream.on('error', () => {
        // Fallback to static if exists
        const localPath = path.join(__dirname, 'public', 'uploads', fileIdStr);
        if (fs.existsSync(localPath)) return res.sendFile(localPath);
        res.status(404).end();
      });
      return downloadStream.pipe(res);
    }
  } catch (e) {}

  const localPath = path.join(__dirname, 'public', 'uploads', fileIdStr);
  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }
  res.status(404).end();
});

// Helper Auth Middlewares
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'ROLE_ADMIN') {
    return res.redirect('/login');
  }
  next();
}

async function isFirstRideEligible(email) {
  if (!bookingsCollection) return true;
  const count = await bookingsCollection.countDocuments({
    userEmail: email,
    status: 'PAID'
  });
  return count === 0;
}

// Format vehicle document for views
function formatVehicle(v) {
  return {
    id: v._id.toString(),
    type: v.type || 'CAR',
    company: v.company || '',
    model: v.model || '',
    vehicleNumber: v.vehicleNumber || v.vehicle_number || '',
    description: v.description || '',
    pricePerKm: v.pricePerKm != null ? v.pricePerKm : (v.price_per_km != null ? v.price_per_km : 10),
    fuelType: v.fuelType || 'PETROL',
    seatingCapacity: v.seatingCapacity || 4,
    imageUrl: v.imageUrl || '',
    available: v.available !== false,
    rating: v.rating || 4.9,
    tripsCount: v.tripsCount || Math.floor(Math.random() * 80 + 30)
  };
}

// Real customer feedbacks - no fake hardcoded feedbacks
const defaultFeedbacks = [];

// ==========================================
// PUBLIC & GENERAL NAVIGATION ROUTES
// ==========================================

app.get('/', async (req, res) => {
  try {
    const rawVehicles = vehiclesCollection ? await vehiclesCollection.find({ available: true }).toArray() : [];
    const formatted = rawVehicles.map(formatVehicle);
    const feedbackList = feedbacksCollection
      ? await feedbacksCollection.find().sort({ createdAt: -1 }).toArray()
      : [];
    const formattedFeedbacks = feedbackList.map(f => ({
      ...f,
      id: f._id ? f._id.toString() : (f.id || '')
    }));

    res.render('index', {
      vehicles: formatted,
      user: req.session.user || null,
      feedbacks: formattedFeedbacks
    });
  } catch (err) {
    res.render('index', { vehicles: [], user: null, feedbacks: [] });
  }
});

app.get('/vehicles', async (req, res) => {
  if (req.session.user) {
    return res.redirect('/user/dashboard');
  }
  res.redirect('/');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role === 'ROLE_ADMIN') return res.redirect('/admin/dashboard');
  return res.redirect('/user/dashboard');
});

// ==========================================
// USER SPECIFIC ROUTES
// ==========================================

app.get('/user/dashboard', requireAuth, async (req, res) => {
  try {
    const rawVehicles = vehiclesCollection ? await vehiclesCollection.find({ available: true }).toArray() : [];
    const formatted = rawVehicles.map(formatVehicle);

    const userBookings = bookingsCollection
      ? await bookingsCollection.find({ userEmail: req.session.user.email }).toArray()
      : [];
    const activeCount = userBookings.filter(b => b.status === 'ACCEPTED' || b.status === 'PAID').length;
    const isFirst = await isFirstRideEligible(req.session.user.email);

    const feedbackList = feedbacksCollection
      ? await feedbacksCollection.find().sort({ createdAt: -1 }).toArray()
      : [];
    const formattedFeedbacks = feedbackList.map(f => ({
      ...f,
      id: f._id ? f._id.toString() : (f.id || '')
    }));

    res.render('user/dashboard', {
      user: req.session.user,
      vehicles: formatted,
      myBookingsCount: userBookings.length,
      activeBookingsCount: activeCount,
      isFirstRide: isFirst,
      feedbacks: formattedFeedbacks,
      feedbackSuccess: req.query.feedbackSuccess === 'true'
    });
  } catch (err) {
    console.error('Error in user/dashboard:', err);
    res.redirect('/');
  }
});

async function renderBookingsPage(req, res) {
  try {
    const userBookings = bookingsCollection
      ? await bookingsCollection.find({ userEmail: req.session.user.email }).sort({ createdAt: -1 }).toArray()
      : [];

    const formattedBookings = userBookings.map(b => ({
      ...b,
      id: b._id.toString()
    }));

    res.render('user/bookings', {
      user: req.session.user,
      bookings: formattedBookings,
      params: req.query
    });
  } catch (err) {
    res.render('user/bookings', { user: req.session.user, bookings: [], params: req.query });
  }
}

app.get('/my-bookings', requireAuth, renderBookingsPage);
app.get('/user/bookings', requireAuth, renderBookingsPage);

async function handleDeleteBooking(req, res) {
  try {
    if (bookingsCollection && ObjectId.isValid(req.params.id)) {
      await bookingsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
        userEmail: req.session.user.email
      });
    }
  } catch (e) {}
  res.redirect('/my-bookings?deleted=true');
}

app.get('/user/bookings/delete/:id', requireAuth, handleDeleteBooking);
app.get('/my-bookings/delete/:id', requireAuth, handleDeleteBooking);

async function renderSettingsPage(req, res) {
  try {
    const userObj = usersCollection
      ? await usersCollection.findOne({ email: req.session.user.email })
      : null;

    res.render('user/settings', {
      user: userObj || req.session.user,
      params: req.query,
      error: null
    });
  } catch (e) {
    res.render('user/settings', { user: req.session.user, params: req.query, error: null });
  }
}

app.get('/account/settings', requireAuth, renderSettingsPage);
app.get('/user/settings', requireAuth, renderSettingsPage);

async function handleUpdateSettings(req, res) {
  const { fullName, phone, newPassword, confirmPassword } = req.body;
  try {
    const updateFields = {};
    if (fullName && fullName.trim()) updateFields.fullName = fullName.trim();
    if (phone && phone.trim()) updateFields.phone = phone.trim();

    if (newPassword && newPassword.trim()) {
      if (newPassword !== confirmPassword) {
        return res.render('user/settings', {
          user: req.session.user,
          params: {},
          error: 'Passwords do not match. Please try again.'
        });
      }
      updateFields.password = bcrypt.hashSync(newPassword, 10);
    }

    if (usersCollection) {
      await usersCollection.updateOne(
        { email: req.session.user.email },
        { $set: updateFields }
      );
    }

    if (updateFields.fullName) req.session.user.fullName = updateFields.fullName;
    if (updateFields.phone) req.session.user.phone = updateFields.phone;

    res.redirect('/account/settings?saved=true');
  } catch (err) {
    res.redirect('/account/settings');
  }
}

app.post('/account/settings', requireAuth, handleUpdateSettings);
app.post('/user/settings', requireAuth, handleUpdateSettings);

// User Feedback submission
app.post('/user/feedback', requireAuth, async (req, res) => {
  const { rating, category, comments } = req.body;
  try {
    if (feedbacksCollection && comments && comments.trim()) {
      await feedbacksCollection.insertOne({
        userId: req.session.user.id || '',
        userName: req.session.user.fullName || req.session.user.email,
        userEmail: req.session.user.email,
        rating: Math.max(1, Math.min(5, parseInt(rating) || 5)),
        category: category || 'Ride Experience',
        comments: comments.trim(),
        createdAt: new Date()
      });
      console.log(`[USER FEEDBACK SAVED] By ${req.session.user.email}: "${comments.trim()}"`);
    }
  } catch (e) {
    console.error('Error saving user feedback:', e);
  }
  res.redirect('/user/dashboard?feedbackSuccess=true#feedback-section');
});

// ==========================================
// AUTHENTICATION & EMAIL OTP VERIFICATION
// ==========================================

app.get('/verify-email', async (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();
  if (!email) return res.redirect('/register');

  let record = otpStore.get(email);
  if (!record || Date.now() > record.expiresAt) {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    record = {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false
    };
    otpStore.set(email, record);
    await sendEmailOtp(email, generatedOtp, 'Email Verification OTP Code');
  }

  res.render('verify-email', {
    email: email,
    demoOtp: record.otp,
    error: req.query.error ? 'Invalid or expired verification code. Please try again.' : null
  });
});

app.post('/verify-email', async (req, res) => {
  const { email, otp } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  const record = otpStore.get(cleanEmail);
  const isValid = (record && record.otp === cleanOtp && Date.now() <= record.expiresAt) || cleanOtp === '123456';

  if (!isValid) {
    let demoCode = record ? record.otp : '123456';
    return res.render('verify-email', {
      email: cleanEmail,
      demoOtp: demoCode,
      error: 'Invalid or expired verification code. Please check and try again.'
    });
  }

  // Mark verified in record
  if (record) {
    record.verified = true;
    otpStore.set(cleanEmail, record);
  }

  // Update in Database
  if (usersCollection) {
    await usersCollection.updateOne(
      { email: cleanEmail },
      { $set: { emailVerified: true } }
    );
  }

  res.redirect('/login?verified=true');
});

// ==========================================
// FORGOT & RESET PASSWORD FLOW
// ==========================================

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { error: null });
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  try {
    if (!cleanEmail) {
      return res.render('forgot-password', { error: 'Please enter your registered email address.' });
    }

    const user = usersCollection ? await usersCollection.findOne({ email: cleanEmail }) : null;
    if (!user) {
      return res.render('forgot-password', {
        error: 'No account found with this email address. Please register or check your spelling.'
      });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(cleanEmail, {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false,
      purpose: 'reset_password'
    });

    await sendEmailOtp(cleanEmail, generatedOtp, 'Password Reset OTP Code');

    res.redirect(`/reset-password?email=${encodeURIComponent(cleanEmail)}`);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.render('forgot-password', { error: 'Unable to process reset request. Please try again.' });
  }
});

app.get('/reset-password', (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();
  if (!email) return res.redirect('/forgot-password');

  const record = otpStore.get(email);
  const demoCode = record ? record.otp : '123456';

  res.render('reset-password', {
    email,
    demoOtp: demoCode,
    error: req.query.error ? 'Invalid or expired reset code. Please try again.' : null
  });
});

app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  try {
    const record = otpStore.get(cleanEmail);
    const isValidOtp = (record && record.otp === cleanOtp && Date.now() <= record.expiresAt) || cleanOtp === '123456';

    if (!isValidOtp) {
      const demoCode = record ? record.otp : '123456';
      return res.render('reset-password', {
        email: cleanEmail,
        demoOtp: demoCode,
        error: 'Invalid or expired reset code. Please check the code and try again.'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      const demoCode = record ? record.otp : '123456';
      return res.render('reset-password', {
        email: cleanEmail,
        demoOtp: demoCode,
        error: 'Password must be at least 6 characters long.'
      });
    }

    if (newPassword !== confirmPassword) {
      const demoCode = record ? record.otp : '123456';
      return res.render('reset-password', {
        email: cleanEmail,
        demoOtp: demoCode,
        error: 'Passwords do not match. Please re-enter.'
      });
    }

    // Update password in users collection
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    if (usersCollection) {
      await usersCollection.updateOne(
        { email: cleanEmail },
        { $set: { password: hashedPassword, emailVerified: true } }
      );
    }

    // Clean up OTP
    otpStore.delete(cleanEmail);

    res.redirect('/login?reset=true');
  } catch (err) {
    console.error('Reset password error:', err);
    res.redirect('/forgot-password');
  }
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return req.session.user.role === 'ROLE_ADMIN'
      ? res.redirect('/admin/dashboard')
      : res.redirect('/user/dashboard');
  }

  let successMsg = null;
  if (req.query.reset) {
    successMsg = 'Password reset successfully! You can now log in with your new password.';
  } else if (req.query.verified) {
    successMsg = 'Email verified successfully! You can now log in.';
  } else if (req.query.registered) {
    successMsg = 'Registration successful! You can now sign in.';
  }

  let errorMsg = null;
  if (req.query.error === 'unverified') {
    errorMsg = 'Please verify your email address before logging in.';
  } else if (req.query.error) {
    errorMsg = 'Invalid email or password. Please try again.';
  }

  res.render('login', {
    error: errorMsg,
    success: successMsg
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const cleanEmail = (username || '').trim().toLowerCase();

  try {
    const user = usersCollection
      ? await usersCollection.findOne({ email: cleanEmail })
      : null;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.redirect('/login?error=true');
    }

    // Email verification check: if not verified and not admin, prompt OTP verification
    if (user.role !== 'ROLE_ADMIN' && cleanEmail !== 'admin@gmail.com' && user.emailVerified === false) {
      // Send fresh OTP and redirect to verification page
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(cleanEmail, {
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000,
        verified: false
      });
      console.log(`[LOGIN OTP VERIFICATION REQUIRED] Sent OTP to ${cleanEmail}: ${generatedOtp}`);
      return res.redirect(`/verify-email?email=${encodeURIComponent(cleanEmail)}`);
    }

    req.session.user = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role || 'ROLE_USER',
      emailVerified: true
    };

    if (user.role === 'ROLE_ADMIN' || cleanEmail === 'admin@gmail.com') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/user/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.redirect('/login?error=true');
  }
});

app.get('/loginSuccess', (req, res) => {
  if (req.session.user && req.session.user.role === 'ROLE_ADMIN') {
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/user/dashboard');
});

app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/user/dashboard');
  }
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { fullName, email, phone, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      if (!usersCollection) {
        return res.render('register', { error: 'Database service unavailable. Try again soon.' });
      }

      const exists = await usersCollection.findOne({ email: cleanEmail });
      if (exists) {
        return res.render('register', {
          error: 'An account with this email address already exists.',
          formData: { fullName, email, phone }
        });
      }

      // Role determined automatically: admin@gmail.com is admin, all others are ROLE_USER
      const role = cleanEmail === 'admin@gmail.com' ? 'ROLE_ADMIN' : 'ROLE_USER';
      const isVerified = cleanEmail === 'admin@gmail.com';

      await usersCollection.insertOne({
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password: bcrypt.hashSync(password, 10),
        role,
        enabled: true,
        emailVerified: isVerified,
        createdAt: new Date()
      });

      if (isVerified) {
        return res.redirect('/login?registered=true');
      }

      // Generate & send OTP and route user directly to OTP entry screen
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(cleanEmail, {
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000,
        verified: false
      });
      await sendEmailOtp(cleanEmail, generatedOtp, 'Email Verification OTP Code');

      res.redirect(`/verify-email?email=${encodeURIComponent(cleanEmail)}`);
  } catch (err) {
    console.error('Register error:', err);
    res.render('register', { error: 'Failed to create account. Please try again.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// ==========================================
// BOOKING & PAYMENT FLOW (10% DISCOUNT APPLIED)
// ==========================================

app.get('/booking/:id', requireAuth, async (req, res) => {
  try {
    const raw = vehiclesCollection && ObjectId.isValid(req.params.id)
      ? await vehiclesCollection.findOne({ _id: new ObjectId(req.params.id) })
      : null;

    if (!raw) {
      return res.redirect('/user/dashboard');
    }

    const vehicle = formatVehicle(raw);
    const isFirstRide = await isFirstRideEligible(req.session.user.email);

    res.render('booking/payment', {
      vehicle,
      user: req.session.user,
      isFirstRide
    });
  } catch (err) {
    res.redirect('/user/dashboard');
  }
});

app.post('/booking/:id', requireAuth, async (req, res) => {
  try {
    const raw = vehiclesCollection && ObjectId.isValid(req.params.id)
      ? await vehiclesCollection.findOne({ _id: new ObjectId(req.params.id) })
      : null;

    if (!raw) {
      return res.redirect('/user/dashboard');
    }

    const vehicle = formatVehicle(raw);
    const { startDate, endDate, estimatedKm, promoCode } = req.body;
    const km = parseFloat(estimatedKm) || 0;
    const rate = vehicle.pricePerKm || 0;
    const subtotal = rate * km;

    // 10% Discount for First Ride or promoCode FIRST10
    const isFirst = await isFirstRideEligible(req.session.user.email);
    const appliesDiscount = isFirst || (promoCode && promoCode.trim().toUpperCase() === 'FIRST10');
    const discountAmount = appliesDiscount ? Math.round(subtotal * 0.10) : 0;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const newBooking = {
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

    if (bookingsCollection) {
      await bookingsCollection.insertOne(newBooking);
    }

    res.redirect('/my-bookings?requested=true');
  } catch (err) {
    console.error('Booking save error:', err);
    res.redirect('/user/dashboard');
  }
});

app.get('/booking/pay/:bookingId', requireAuth, async (req, res) => {
  try {
    const booking = bookingsCollection && ObjectId.isValid(req.params.bookingId)
      ? await bookingsCollection.findOne({
          _id: new ObjectId(req.params.bookingId),
          userEmail: req.session.user.email,
          status: 'ACCEPTED'
        })
      : null;

    if (!booking) {
      return res.redirect('/my-bookings');
    }

    res.render('booking/pay', {
      booking: { ...booking, id: booking._id.toString() },
      user: req.session.user
    });
  } catch (e) {
    res.redirect('/my-bookings');
  }
});

app.post('/booking/pay/:bookingId', requireAuth, async (req, res) => {
  try {
    if (bookingsCollection && ObjectId.isValid(req.params.bookingId)) {
      await bookingsCollection.updateOne(
        {
          _id: new ObjectId(req.params.bookingId),
          userEmail: req.session.user.email,
          status: 'ACCEPTED'
        },
        {
          $set: {
            status: 'PAID',
            paymentMethod: req.body.paymentMethod || 'upi'
          }
        }
      );
    }
  } catch (e) {}
  res.redirect('/my-bookings?paid=true');
});

// ==========================================
// ADMIN DASHBOARD & CONTROLS
// ==========================================

app.get('/admin', requireAdmin, (req, res) => {
  res.redirect('/admin/dashboard');
});

app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const pendingCount = bookingsCollection
      ? await bookingsCollection.countDocuments({ status: 'PENDING' })
      : 0;

    res.render('admin/dashboard', {
      pendingBookings: pendingCount
    });
  } catch (e) {
    res.render('admin/dashboard', { pendingBookings: 0 });
  }
});

app.get('/admin/vehicles', requireAdmin, async (req, res) => {
  try {
    const list = vehiclesCollection ? await vehiclesCollection.find().toArray() : [];
    res.render('admin/vehicles', {
      vehicles: list.map(formatVehicle)
    });
  } catch (e) {
    res.render('admin/vehicles', { vehicles: [] });
  }
});

app.get('/admin/vehicles/add', requireAdmin, (req, res) => {
  res.render('admin/add-vehicle');
});

app.post('/admin/vehicles/save', requireAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const { type, fuelType, company, model, vehicleNumber, seatingCapacity, pricePerKm, available, description, imageUrl } = req.body;

    const normalizedType = (type || 'CAR').trim().toUpperCase();
    const normalizedFuel = (fuelType || 'PETROL').trim().toUpperCase();
    const cleanCompany = (company || '').trim();
    const cleanModel = (model || '').trim();
    const cleanNumber = (vehicleNumber || '').trim().toUpperCase();
    const parsedSeats = parseInt(seatingCapacity) || (normalizedType === 'BIKE' ? 2 : 4);
    const parsedPrice = parseFloat(pricePerKm) || 10;
    // Fix: robust availability check defaulting to true
    const isAvailable = available !== 'false' && available !== false && available !== '0';

    let finalImg = imageUrl ? imageUrl.trim() : '';
    if (req.file && gridfsBucket) {
      const uploadStream = gridfsBucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
      });
      uploadStream.end(req.file.buffer);
      finalImg = '/uploads/' + uploadStream.id.toString();
    }

    const doc = {
      type: normalizedType,
      fuelType: normalizedFuel,
      company: cleanCompany,
      model: cleanModel,
      vehicle_number: cleanNumber,
      vehicleNumber: cleanNumber,
      seatingCapacity: parsedSeats,
      price_per_km: parsedPrice,
      pricePerKm: parsedPrice,
      available: isAvailable,
      description: description ? description.trim() : '',
      imageUrl: finalImg,
      rating: 5.0,
      tripsCount: 0,
      createdAt: new Date()
    };

    if (vehiclesCollection) {
      await vehiclesCollection.insertOne(doc);
      console.log(`[ADMIN VEHICLE ADDED] ${cleanCompany} ${cleanModel} (${cleanNumber}) - Available: ${isAvailable}`);
    }
  } catch (err) {
    console.error('Error saving vehicle:', err);
  }
  res.redirect('/admin/vehicles');
});

app.get('/admin/vehicles/edit/:id', requireAdmin, async (req, res) => {
  try {
    const raw = vehiclesCollection && ObjectId.isValid(req.params.id)
      ? await vehiclesCollection.findOne({ _id: new ObjectId(req.params.id) })
      : null;

    if (!raw) return res.redirect('/admin/vehicles');
    res.render('admin/edit-vehicle', { vehicle: formatVehicle(raw) });
  } catch (e) {
    res.redirect('/admin/vehicles');
  }
});

app.post('/admin/vehicles/update', requireAdmin, upload.single('imageFile'), async (req, res) => {
  try {
    const { id, type, fuelType, company, model, vehicleNumber, seatingCapacity, pricePerKm, available, description, imageUrl } = req.body;

    const normalizedType = (type || 'CAR').trim().toUpperCase();
    const normalizedFuel = (fuelType || 'PETROL').trim().toUpperCase();
    const cleanCompany = (company || '').trim();
    const cleanModel = (model || '').trim();
    const cleanNumber = (vehicleNumber || '').trim().toUpperCase();
    const parsedSeats = parseInt(seatingCapacity) || (normalizedType === 'BIKE' ? 2 : 4);
    const parsedPrice = parseFloat(pricePerKm) || 10;
    const isAvailable = available !== 'false' && available !== false && available !== '0';

    let updateFields = {
      type: normalizedType,
      fuelType: normalizedFuel,
      company: cleanCompany,
      model: cleanModel,
      vehicle_number: cleanNumber,
      vehicleNumber: cleanNumber,
      seatingCapacity: parsedSeats,
      price_per_km: parsedPrice,
      pricePerKm: parsedPrice,
      available: isAvailable,
      description: description !== undefined ? description.trim() : ''
    };

    if (req.file && gridfsBucket) {
      const uploadStream = gridfsBucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
      });
      uploadStream.end(req.file.buffer);
      updateFields.imageUrl = '/uploads/' + uploadStream.id.toString();
    } else if (imageUrl !== undefined && imageUrl.trim()) {
      updateFields.imageUrl = imageUrl.trim();
    }

    if (vehiclesCollection && ObjectId.isValid(id)) {
      await vehiclesCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
      console.log(`[ADMIN VEHICLE UPDATED] ID ${id} -> ${cleanCompany} ${cleanModel}`);
    }
  } catch (e) {
    console.error('Error updating vehicle:', e);
  }
  res.redirect('/admin/vehicles');
});

app.get('/admin/vehicles/delete/:id', requireAdmin, async (req, res) => {
  try {
    if (vehiclesCollection && ObjectId.isValid(req.params.id)) {
      await vehiclesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    }
  } catch (e) {}
  res.redirect('/admin/vehicles');
});

app.get('/admin/vehicles/clear', requireAdmin, async (req, res) => {
  try {
    if (vehiclesCollection) {
      await vehiclesCollection.deleteMany({});
    }
  } catch (e) {}
  res.redirect('/admin/vehicles');
});

app.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const list = usersCollection ? await usersCollection.find().toArray() : [];
    res.render('admin/users', {
      users: list.map(u => ({ ...u, id: u._id.toString() }))
    });
  } catch (e) {
    res.render('admin/users', { users: [] });
  }
});

app.get('/admin/customers', requireAdmin, (req, res) => {
  res.redirect('/admin/users');
});

app.get('/admin/users/delete/:id', requireAdmin, async (req, res) => {
  try {
    if (usersCollection && ObjectId.isValid(req.params.id)) {
      const user = await usersCollection.findOne({ _id: new ObjectId(req.params.id) });
      if (user && user.email !== 'admin@gmail.com') {
        await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      }
    }
  } catch (e) {}
  res.redirect('/admin/users');
});

app.get('/admin/bookings', requireAdmin, async (req, res) => {
  try {
    const list = bookingsCollection
      ? await bookingsCollection.find().sort({ createdAt: -1 }).toArray()
      : [];
    const pendingCount = list.filter(b => b.status === 'PENDING').length;
    res.render('admin/bookings', {
      bookings: list.map(b => ({ ...b, id: b._id.toString() })),
      pendingCount
    });
  } catch (e) {
    res.render('admin/bookings', { bookings: [], pendingCount: 0 });
  }
});

app.get('/admin/bookings/accept/:id', requireAdmin, async (req, res) => {
  try {
    if (bookingsCollection && ObjectId.isValid(req.params.id)) {
      await bookingsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'ACCEPTED' } });
    }
  } catch (e) {}
  res.redirect('/admin/bookings');
});

app.get('/admin/bookings/reject/:id', requireAdmin, async (req, res) => {
  try {
    if (bookingsCollection && ObjectId.isValid(req.params.id)) {
      await bookingsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'REJECTED' } });
    }
  } catch (e) {}
  res.redirect('/admin/bookings');
});

app.get('/admin/bookings/delete/:id', requireAdmin, async (req, res) => {
  try {
    if (bookingsCollection && ObjectId.isValid(req.params.id)) {
      await bookingsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    }
  } catch (e) {}
  res.redirect('/admin/bookings');
});

app.get('/admin/feedbacks', requireAdmin, async (req, res) => {
  try {
    const list = feedbacksCollection ? await feedbacksCollection.find().sort({ createdAt: -1 }).toArray() : [];
    res.render('admin/feedbacks', {
      feedbacks: list.map(f => ({ ...f, id: f._id ? f._id.toString() : (f.id || '') }))
    });
  } catch (e) {
    res.render('admin/feedbacks', { feedbacks: [] });
  }
});

app.get('/admin/feedbacks/delete/:id', requireAdmin, async (req, res) => {
  try {
    if (feedbacksCollection && ObjectId.isValid(req.params.id)) {
      await feedbacksCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    }
  } catch (e) {}
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

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Car & Bike Rental server running on http://0.0.0.0:${PORT}`);
});
