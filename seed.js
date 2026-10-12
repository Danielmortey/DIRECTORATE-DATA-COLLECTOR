require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');
const Supervisor = require('./server/models/Supervisor');
const Inspection = require('./server/models/Inspection');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/directorate-collector';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. CLEAR EXISTING DATA
    //  ensures we don't create duplicate records if you run the script multiple times
    await User.deleteMany({});
    await Supervisor.deleteMany({});
    await Inspection.deleteMany({});
    console.log('Cleared existing database records.');

    // 2. CREATE SYSTEM USERS
    //  use .create() instead of insertMany so the password hashing hook in the User model runs properly
    const adminUser = await User.create({
      username: 'System Admin',
      email: 'mortey43@gmail.com',
      password: 'password123',
      role: 'ADMIN'
    });

    await User.create({
      username: 'Field Officer 1',
      email: 'n',
      password: 'password123',
      role: 'DATA_COLLECTOR'
    });
    console.log('Created Admin and Data Collector users.');

    // 3. CREATE SUPERVISORS
    const supervisorsData = [
      { name: 'Dr. Kwame Nkrumah', email: 'knkrumah@directorate.gov', unit: 'Quality Assurance' },
      { name: 'Grace Ofori', email: 'gofori@directorate.gov', unit: 'Field Monitoring' },
      { name: 'Samuel Mensah', email: 'smensah@directorate.gov', unit: 'Compliance' },
      { name: 'Aisha Mohammed', email: 'amohammed@directorate.gov', unit: 'Investigations' }
    ];
    const insertedSupervisors = await Supervisor.insertMany(supervisorsData);
    console.log('Created sample supervisors.');

    // 4. CREATE SAMPLE INSPECTIONS
    // mixed dates, types, and statuses so  dashboard charts have varied data to display
    const inspectionsData = [
      {
        referenceNumber: 'DIR-2026-000001',
        serialNumber: 1,
        dateOfInspection: new Date('2026-02-15'),
        quarter: 'Q1',
        inspectionType: 'Routine Inspection',
        identifiedIssues: 'Minor cracks found in the eastern perimeter wall.',
        location: 'Adabraka, Accra',
        stakeholders: ['Local Assembly', 'Site Manager'],
        recommendations: 'Repair cracks within 30 days and submit proof.',
        supervisorId: insertedSupervisors[0]._id,
        supervisorName: insertedSupervisors[0].name,
        status: 'Resolved'
      },
      {
        referenceNumber: 'DIR-2026-000002',
        serialNumber: 2,
        dateOfInspection: new Date('2026-05-10'),
        quarter: 'Q2',
        inspectionType: 'Monitoring Visit',
        identifiedIssues: 'Drainage system blocked by construction debris.',
        location: 'Osu, Accra',
        stakeholders: ['Environmental Agency'],
        recommendations: 'Immediate clearance of all drainage channels required.',
        supervisorId: insertedSupervisors[1]._id,
        supervisorName: insertedSupervisors[1].name,
        status: 'Follow-up Required',
        followUp: {
          actionRequired: 'Verify drainage clearance',
          responsiblePerson: 'Site Engineer',
          completionStatus: false
        }
      },
      {
        referenceNumber: 'DIR-2026-000003',
        serialNumber: 3,
        dateOfInspection: new Date('2026-07-22'),
        quarter: 'Q3',
        inspectionType: 'Compliance Inspection',
        identifiedIssues: 'Safety gear missing for 40% of active workers on site.',
        location: 'Cantonments, Accra',
        stakeholders: ['Safety Inspector', 'Labor Union Rep'],
        recommendations: 'Halt non-essential work until PPE is procured.',
        supervisorId: insertedSupervisors[2]._id,
        supervisorName: insertedSupervisors[2].name,
        status: 'Under Review'
      },
      {
        referenceNumber: 'DIR-2026-000004',
        serialNumber: 4,
        dateOfInspection: new Date('2026-08-05'),
        quarter: 'Q3',
        inspectionType: 'Investigation',
        identifiedIssues: 'Unapproved structural changes to the roof support system.',
        location: 'East Legon',
        stakeholders: ['Chief Architect'],
        recommendations: 'Submit revised structural blueprints for immediate review.',
        supervisorId: insertedSupervisors[3]._id,
        supervisorName: insertedSupervisors[3].name,
        status: 'Closed'
      },
      {
        referenceNumber: 'DIR-2026-000005',
        serialNumber: 5,
        dateOfInspection: new Date(), // Current date (Q4 2026)
        quarter: 'Q4',
        inspectionType: 'Routine Inspection',
        identifiedIssues: 'No issues found. Site is fully compliant.',
        location: 'Tema Community 1',
        stakeholders: ['Port Authority'],
        recommendations: 'Maintain current standards.',
        supervisorId: insertedSupervisors[0]._id,
        supervisorName: insertedSupervisors[0].name,
        status: 'Submitted'
      }
    ];

    await Inspection.insertMany(inspectionsData);
    console.log('Created sample inspections.');

    console.log('\n--- SEEDING COMPLETE ---');
    console.log('You can now log in to the system using:');
    console.log('Admin Email: admin@directorate.gov');
    console.log('Password:    password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();