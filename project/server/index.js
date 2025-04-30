import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'parking_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database with seed data
async function initializeDatabase() {
  const connection = await pool.getConnection();
  
  try {
    // Create tables if they don't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'employee') NOT NULL,
        parking_location_id INT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS parking_locations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        total_slots INT NOT NULL,
        available_slots INT NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        license_plate VARCHAR(20) NOT NULL,
        entry_time DATETIME NOT NULL,
        exit_time DATETIME NULL,
        employee_id INT NOT NULL,
        parking_location_id INT NOT NULL,
        cost DECIMAL(10,2) NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        hourly_rate DECIMAL(5,2) NOT NULL
      )
    `);

    // Check if admin user exists
    const [adminRows] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      ['admin@parkease.com']
    );

    // Insert admin if not exists
    if (adminRows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@parkease.com', hashedPassword, 'admin']
      );
    }

    // Check if settings exist
    const [settingsRows] = await connection.query('SELECT * FROM settings WHERE id = 1');
    
    // Insert default settings if not exists
    if (settingsRows.length === 0) {
      await connection.query(
        'INSERT INTO settings (id, hourly_rate) VALUES (1, 2.50)'
      );
    }

    // Insert sample parking location if none exist
    const [locationRows] = await connection.query('SELECT * FROM parking_locations LIMIT 1');
    
    if (locationRows.length === 0) {
      await connection.query(
        'INSERT INTO parking_locations (name, latitude, longitude, total_slots, available_slots) VALUES (?, ?, ?, ?, ?)',
        ['Downtown Parking', 40.7128, -74.0060, 100, 100]
      );
      
      // Get the inserted location id
      const [newLocation] = await connection.query('SELECT id FROM parking_locations ORDER BY id DESC LIMIT 1');
      const locationId = newLocation[0].id;
      
      // Create sample employee for this location
      const hashedPassword = await bcrypt.hash('employee123', 10);
      await connection.query(
        'INSERT INTO users (name, email, password, role, parking_location_id) VALUES (?, ?, ?, ?, ?)',
        ['Employee User', 'employee@parkease.com', hashedPassword, 'employee', locationId]
      );
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    connection.release();
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Role-based access middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

// Routes

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from database
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, parking_location_id: user.parking_location_id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    // Send response without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Admin Routes
app.post('/api/admin/parking-location', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { name, latitude, longitude, total_slots } = req.body;
    
    // Insert new parking location
    await pool.query(
      'INSERT INTO parking_locations (name, latitude, longitude, total_slots, available_slots) VALUES (?, ?, ?, ?, ?)',
      [name, latitude, longitude, total_slots, total_slots]
    );
    
    res.status(201).json({ message: 'Parking location added successfully' });
  } catch (error) {
    console.error('Error adding parking location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/parking-location/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, total_slots } = req.body;
    
    // Get current location data
    const [locationRows] = await pool.query('SELECT * FROM parking_locations WHERE id = ?', [id]);
    
    if (locationRows.length === 0) {
      return res.status(404).json({ message: 'Parking location not found' });
    }
    
    const currentLocation = locationRows[0];
    const slotsDifference = total_slots - currentLocation.total_slots;
    
    // Update parking location
    await pool.query(
      'UPDATE parking_locations SET name = ?, latitude = ?, longitude = ?, total_slots = ?, available_slots = available_slots + ? WHERE id = ?',
      [name, latitude, longitude, total_slots, slotsDifference, id]
    );
    
    res.json({ message: 'Parking location updated successfully' });
  } catch (error) {
    console.error('Error updating parking location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/parking-location/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are active vehicles in this location
    const [activeVehicles] = await pool.query(
      'SELECT COUNT(*) AS count FROM vehicles WHERE parking_location_id = ? AND exit_time IS NULL',
      [id]
    );
    
    if (activeVehicles[0].count > 0) {
      return res.status(400).json({ message: 'Cannot delete location with active vehicles' });
    }
    
    // Check if there are employees assigned to this location
    const [assignedEmployees] = await pool.query(
      'SELECT COUNT(*) AS count FROM users WHERE parking_location_id = ?',
      [id]
    );
    
    if (assignedEmployees[0].count > 0) {
      return res.status(400).json({ message: 'Cannot delete location with assigned employees' });
    }
    
    // Delete the parking location
    await pool.query('DELETE FROM parking_locations WHERE id = ?', [id]);
    
    res.json({ message: 'Parking location deleted successfully' });
  } catch (error) {
    console.error('Error deleting parking location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/employee', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, parking_location_id } = req.body;
    
    // Check if email already exists
    const [emailCheck] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (emailCheck.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Check if parking location exists
    const [locationCheck] = await pool.query('SELECT * FROM parking_locations WHERE id = ?', [parking_location_id]);
    
    if (locationCheck.length === 0) {
      return res.status(400).json({ message: 'Invalid parking location' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert employee
    await pool.query(
      'INSERT INTO users (name, email, password, role, parking_location_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'employee', parking_location_id]
    );
    
    res.status(201).json({ message: 'Employee added successfully' });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/employee/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, parking_location_id } = req.body;
    
    // Check if employee exists
    const [employeeCheck] = await pool.query('SELECT * FROM users WHERE id = ? AND role = "employee"', [id]);
    
    if (employeeCheck.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if email already exists and belongs to another user
    const [emailCheck] = await pool.query('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
    
    if (emailCheck.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Check if parking location exists
    const [locationCheck] = await pool.query('SELECT * FROM parking_locations WHERE id = ?', [parking_location_id]);
    
    if (locationCheck.length === 0) {
      return res.status(400).json({ message: 'Invalid parking location' });
    }
    
    // Prepare update query based on whether password is provided
    let query, params;
    
    if (password) {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET name = ?, email = ?, password = ?, parking_location_id = ? WHERE id = ?';
      params = [name, email, hashedPassword, parking_location_id, id];
    } else {
      query = 'UPDATE users SET name = ?, email = ?, parking_location_id = ? WHERE id = ?';
      params = [name, email, parking_location_id, id];
    }
    
    // Update employee
    await pool.query(query, params);
    
    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/employee/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const [employeeCheck] = await pool.query('SELECT * FROM users WHERE id = ? AND role = "employee"', [id]);
    
    if (employeeCheck.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Delete employee
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/rate', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { hourly_rate } = req.body;
    
    // Update hourly rate
    await pool.query('UPDATE settings SET hourly_rate = ? WHERE id = 1', [hourly_rate]);
    
    res.json({ message: 'Hourly rate updated successfully' });
  } catch (error) {
    console.error('Error updating hourly rate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/dashboard', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Get total locations
    const [locationsResult] = await pool.query('SELECT COUNT(*) as count FROM parking_locations');
    const totalLocations = locationsResult[0].count;
    
    // Get total employees
    const [employeesResult] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "employee"');
    const totalEmployees = employeesResult[0].count;
    
    // Get total vehicles
    const [vehiclesResult] = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    const totalVehicles = vehiclesResult[0].count;
    
    // Get hourly rate
    const [rateResult] = await pool.query('SELECT hourly_rate FROM settings WHERE id = 1');
    const hourlyRate = rateResult[0].hourly_rate;
    
    // Calculate occupancy rate
    const [occupancyResult] = await pool.query(`
      SELECT 
        SUM(total_slots) as total,
        SUM(total_slots - available_slots) as occupied
      FROM 
        parking_locations
    `);
    
    const occupancyRate = occupancyResult[0].total > 0
      ? Math.round((occupancyResult[0].occupied / occupancyResult[0].total) * 100)
      : 0;
    
    res.json({
      totalLocations,
      totalEmployees,
      totalVehicles,
      hourlyRate,
      occupancyRate
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/locations', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Get all locations
    const [locations] = await pool.query('SELECT * FROM parking_locations');
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/employees', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Get all employees with location name
    const [employees] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.parking_location_id,
        p.name as location_name
      FROM 
        users u
      LEFT JOIN 
        parking_locations p ON u.parking_location_id = p.id
      WHERE 
        u.role = 'employee'
    `);
    
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/rate', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Get hourly rate
    const [rateResult] = await pool.query('SELECT hourly_rate FROM settings WHERE id = 1');
    const hourlyRate = rateResult[0].hourly_rate;
    
    res.json({ hourly_rate: hourlyRate });
  } catch (error) {
    console.error('Error fetching hourly rate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Employee Routes
app.get('/api/employee/location', authenticateToken, authorizeRole(['employee']), async (req, res) => {
  try {
    const locationId = req.user.parking_location_id;
    
    if (!locationId) {
      return res.status(400).json({ message: 'No location assigned to this employee' });
    }
    
    // Get assigned location details
    const [location] = await pool.query('SELECT * FROM parking_locations WHERE id = ?', [locationId]);
    
    if (location.length === 0) {
      return res.status(404).json({ message: 'Assigned location not found' });
    }
    
    res.json(location[0]);
  } catch (error) {
    console.error('Error fetching employee location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/employee/checkin', authenticateToken, authorizeRole(['employee']), async (req, res) => {
  try {
    const employeeId = req.user.id;
    const locationId = req.user.parking_location_id;
    const { license_plate } = req.body;
    
    if (!locationId) {
      return res.status(400).json({ message: 'No location assigned to this employee' });
    }
    
    // Check if location has available slots
    const [location] = await pool.query('SELECT available_slots FROM parking_locations WHERE id = ?', [locationId]);
    
    if (location[0].available_slots <= 0) {
      return res.status(400).json({ message: 'No available parking slots' });
    }
    
    // Begin transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Decrement available slots
      await connection.query(
        'UPDATE parking_locations SET available_slots = available_slots - 1 WHERE id = ?',
        [locationId]
      );
      
      // Insert vehicle entry
      await connection.query(`
        INSERT INTO vehicles (license_plate, entry_time, employee_id, parking_location_id)
        VALUES (?, NOW(), ?, ?)
      `, [license_plate, employeeId, locationId]);
      
      await connection.commit();
      res.status(201).json({ message: 'Vehicle checked in successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error checking in vehicle:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/employee/checkout', authenticateToken, authorizeRole(['employee']), async (req, res) => {
  try {
    const employeeId = req.user.id;
    const locationId = req.user.parking_location_id;
    const { vehicle_id } = req.body;
    
    // Check if vehicle exists and belongs to this location
    const [vehicleCheck] = await pool.query(`
      SELECT * FROM vehicles 
      WHERE id = ? AND parking_location_id = ? AND exit_time IS NULL
    `, [vehicle_id, locationId]);
    
    if (vehicleCheck.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found or already checked out' });
    }
    
    // Get hourly rate
    const [rateResult] = await pool.query('SELECT hourly_rate FROM settings WHERE id = 1');
    const hourlyRate = rateResult[0].hourly_rate;
    
    // Calculate parking duration and cost
    const entryTime = new Date(vehicleCheck[0].entry_time);
    const exitTime = new Date();
    const durationHours = (exitTime - entryTime) / (1000 * 60 * 60); // Convert ms to hours
    const cost = parseFloat((durationHours * hourlyRate).toFixed(2));
    
    // Begin transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update vehicle with exit time and cost
      await connection.query(`
        UPDATE vehicles SET exit_time = NOW(), cost = ? WHERE id = ?
      `, [cost, vehicle_id]);
      
      // Increment available slots
      await connection.query(
        'UPDATE parking_locations SET available_slots = available_slots + 1 WHERE id = ?',
        [locationId]
      );
      
      await connection.commit();
      res.json({ message: 'Vehicle checked out successfully', cost });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error checking out vehicle:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/employee/vehicles', authenticateToken, authorizeRole(['employee']), async (req, res) => {
  try {
    const locationId = req.user.parking_location_id;
    
    // Get recent vehicles for this location
    const [vehicles] = await pool.query(`
      SELECT * FROM vehicles
      WHERE parking_location_id = ?
      ORDER BY entry_time DESC
      LIMIT 20
    `, [locationId]);
    
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public Routes
app.get('/api/locations', async (req, res) => {
  try {
    // Get all locations with available slots
    const [locations] = await pool.query('SELECT * FROM parking_locations');
    res.json(locations);
  } catch (error) {
    console.error('Error fetching public locations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Settings Routes
app.get('/api/settings/rate', async (req, res) => {
  try {
    // Get hourly rate (for public or authenticated users)
    const [rateResult] = await pool.query('SELECT hourly_rate FROM settings WHERE id = 1');
    const hourlyRate = rateResult[0].hourly_rate;
    
    res.json({ hourly_rate: hourlyRate });
  } catch (error) {
    console.error('Error fetching hourly rate:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Initialize the database when the server starts
initializeDatabase();

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});