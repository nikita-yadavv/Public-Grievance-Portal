const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Grievance = require('./models/Grievance');

dotenv.config();

const sampleUsers = [
  {
    name: 'Nikita Citizen',
    email: 'citizen@example.com',
    password: 'password123',
    role: 'citizen',
    department: 'General',
    isApproved: true,
    isEmailVerified: true
  },
  {
    name: 'Chief Municipal Commissioner',
    email: 'chief@citygov.org',
    password: 'adminpassword123',
    role: 'superadmin',
    department: 'Municipal Headquarters',
    isApproved: true,
    isEmailVerified: true
  },
  {
    name: 'Officer Rajesh Kumar',
    email: 'rajesh.officer@citygov.org',
    password: 'password123',
    role: 'admin',
    department: 'Water Supply Department',
    isApproved: true,
    isEmailVerified: true
  },
  {
    name: 'Officer Priya Sharma',
    email: 'priya.officer@citygov.org',
    password: 'password123',
    role: 'admin',
    department: 'Sanitation & Waste',
    isApproved: false, // Pending approval by Chief Officer
    isEmailVerified: true // Email verified but awaiting Chief's approval
  }
];

const sampleGrievances = [
  {
    title: 'Severe Water Pipeline Leakage on Main Street',
    category: 'Water Supply',
    description: 'Fresh water pipeline ruptured near Sector 4 community park. Water is flooding the street and wasting resources.',
    location: 'Sector 4, Main Street, Ward 12',
    priority: 'Urgent',
    status: 'In Progress',
    adminRemarks: 'Municipal water maintenance team dispatched with replacement pipeline parts.'
  },
  {
    title: 'Street Lights Non-functional for Past 2 Weeks',
    category: 'Electricity & Power',
    description: 'Over 8 consecutive street light poles are completely dark, posing safety hazards for pedestrians at night.',
    location: 'Crossroad 7, Near Metro Pillar 140',
    priority: 'High',
    status: 'Pending',
    adminRemarks: 'Awaiting official review.'
  },
  {
    title: 'Illegal Garbage Dumping Near Market Entrance',
    category: 'Sanitation & Waste',
    description: 'Open waste accumulating near the market gate causing foul smell and health hazard.',
    location: 'Vegetable Market North Gate, Ward 8',
    priority: 'Medium',
    status: 'Resolved',
    adminRemarks: 'Waste clearance truck deployed. Sanitization completed and warning notice installed.'
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed]: Connected to MongoDB');

    // Clean existing records
    await User.deleteMany();
    await Grievance.deleteMany();
    console.log('[Seed]: Cleared existing database records');

    // Hash passwords & insert users
    const salt = await bcrypt.genSalt(10);
    const createdUsers = [];

    for (const u of sampleUsers) {
      const hashedPassword = await bcrypt.hash(u.password, salt);
      const user = await User.create({
        ...u,
        password: hashedPassword
      });
      createdUsers.push(user);
    }
    console.log(`[Seed]: Created ${createdUsers.length} sample users`);

    const citizen = createdUsers.find(u => u.role === 'citizen');
    const officerRajesh = createdUsers.find(u => u.email === 'rajesh.officer@citygov.org');

    // Insert sample grievances
    await Grievance.create({
      ...sampleGrievances[0],
      user: citizen._id,
      updatedBy: officerRajesh._id,
      lastUpdatedDate: new Date()
    });

    await Grievance.create({
      ...sampleGrievances[1],
      user: citizen._id
    });

    await Grievance.create({
      ...sampleGrievances[2],
      user: citizen._id,
      updatedBy: officerRajesh._id,
      lastUpdatedDate: new Date()
    });

    console.log(`[Seed]: Created ${sampleGrievances.length} sample grievances with officer audit trails`);

    console.log('\n============================================================');
    console.log(' SEEDING COMPLETE! DEMO ACCOUNTS READY FOR EVALUATION:');
    console.log(' 1. Citizen:      citizen@example.com        / password123');
    console.log(' 2. Chief Officer: chief@citygov.org         / adminpassword123 (Super Admin)');
    console.log(' 3. Active Officer: rajesh.officer@citygov.org / password123 (Approved)');
    console.log(' 4. Pending Officer: priya.officer@citygov.org / password123 (Awaiting Approval)');
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
