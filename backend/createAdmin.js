// createAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'admin@aggiesattic.org';
  const password = 'P@ssw0rd';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = new Admin({ email, passwordHash });

  try {
    await admin.save();
    console.log('✅ Admin created successfully');
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();
