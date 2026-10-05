import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.APPLET_ID ? 3000 : (process.env.PORT || 3000);

// MongoDB Atlas connection
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

    // Ensure default admin exists if collection is empty
    const adminExists = await usersCollection.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      await usersCollection.insertOne({
        fullName: 'Administrator',
        email: 'admin@gmail.com',
        phone: '0000000000',
        password: bcrypt.hashSync('admin123', 10),
        role: 'ROLE_ADMIN',
        enabled: true,
        createdAt: new Date()
      });
      console.log('Seeded default admin: admin@gmail.com');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
initDB();

// Multer memory storage for uploading directly into GridFS
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

// Sample feedbacks for realistic community display
const defaultFeedbacks = [
  {
    id: 'fb_01',
    userName: 'Ankit Mishra',
    rating: 5,
    tripTime: '2 hours ago',
    vehicleRented: 'Mahindra Thar 4x4',
    comments: 'Took the vehicle on a weekend getaway. The suspension handled rough terrain like butter! Plus the 10% first ride discount saved me good money.'
  },
  {
    id: 'fb_02',
    userName: 'Sneha Kulkarni',
    rating: 5,
    tripTime: '5 hours ago',
    vehicleRented: 'Royal Enfield Classic 350',
    comments: 'Super clean vehicle. Instant approval by admin and smooth UPI payment. Will recommend to all my friends!'
  },
  {
    id: 'fb_03',
    userName: 'Vikram Rajput',
    rating: 5,
    tripTime: 'Yesterday',
    vehicleRented: 'Ather 450X',
    comments: 'Fast pickup, 100% battery, and transparent per-km rates with zero hidden fees.'
  }
];

// ==========================================
// PUBLIC & GENERAL NAVIGATION ROUTES
// ==========================================

app.get('/', async (req, res) => {
  try {
    const rawVehicles = vehiclesCollection ? await vehiclesCollection.find({ available: true }).toArray() : [];
    const formatted = rawVehicles.map(formatVehicle);
    res.render('index', {
      vehicles: formatted,
      user: req.session.user || null,
      feedbacks: defaultFeedbacks
    });
  } catch (err) {
    res.render('index', { vehicles: [], user: null, feedbacks: defaultFeedbacks });
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

    res.render('user/dashboard', {
      user: req.session.user,
      vehicles: formatted,
      myBookingsCount: userBookings.length,
      activeBookingsCount: activeCount,
      isFirstRide: isFirst,
      feedbacks: defaultFeedbacks,
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
        userId: req.session.user.id,
        userName: req.session.user.fullName || req.session.user.email,
        userEmail: req.session.user.email,
        rating: parseFloat(rating) || 5,
        category: category || 'General',
        comments: comments.trim(),
        createdAt: new Date()
      });
    }
  } catch (e) {}
  res.redirect('/user/dashboard?feedbackSuccess=true#feedback-section');
});

// ==========================================
// AUTHENTICATION (PURE & CLEAN)
// ==========================================

app.get('/login', (req, res) => {
  if (req.session.user) {
    return req.session.user.role === 'ROLE_ADMIN'
      ? res.redirect('/admin/dashboard')
      : res.redirect('/user/dashboard');
  }
  res.render('login', {
    error: req.query.error ? 'Invalid email or password. Please try again.' : null,
    success: req.query.registered ? 'Registration successful! You can now sign in.' : null
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

    req.session.user = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role || 'ROLE_USER'
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

    await usersCollection.insertOne({
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password: bcrypt.hashSync(password, 10),
      role,
      enabled: true,
      createdAt: new Date()
    });

    res.redirect('/login?registered=true');
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

    let finalImg = imageUrl || '';
    if (req.file && gridfsBucket) {
      // Stream directly into GridFS
      const uploadStream = gridfsBucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
      });
      uploadStream.end(req.file.buffer);
      finalImg = '/uploads/' + uploadStream.id.toString();
    }

    const doc = {
      type: type || 'CAR',
      fuelType: fuelType || 'PETROL',
      company: (company || '').trim(),
      model: (model || '').trim(),
      vehicle_number: (vehicleNumber || '').trim().toUpperCase(),
      seatingCapacity: parseInt(seatingCapacity) || 4,
      price_per_km: parseFloat(pricePerKm) || 10,
      available: available === 'true',
      description: description ? description.trim() : '',
      imageUrl: finalImg,
      createdAt: new Date()
    };

    if (vehiclesCollection) {
      await vehiclesCollection.insertOne(doc);
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

    let updateFields = {
      type: type || 'CAR',
      fuelType: fuelType || 'PETROL',
      company: (company || '').trim(),
      model: (model || '').trim(),
      vehicle_number: (vehicleNumber || '').trim().toUpperCase(),
      seatingCapacity: parseInt(seatingCapacity) || 4,
      price_per_km: parseFloat(pricePerKm) || 10,
      available: available === 'true',
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
    }
  } catch (e) {}
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
      feedbacks: list.length > 0 ? list.map(f => ({ ...f, id: f._id.toString() })) : defaultFeedbacks
    });
  } catch (e) {
    res.render('admin/feedbacks', { feedbacks: defaultFeedbacks });
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
