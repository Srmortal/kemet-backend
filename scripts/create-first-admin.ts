import { FirebaseAdminService } from '../src/services/firebase-admin.service';

/**
 * Script to create the first admin user
 * Run with: npx ts-node -r tsconfig-paths/register scripts/create-first-admin.ts
 */
async function createFirstAdmin() {
  const adminService = new FirebaseAdminService();

  const email = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeThisSecurePassword123!';
  const displayName = process.env.ADMIN_NAME || 'Super Admin';

  try {
    console.log('Creating first admin user...');

    // Create admin user
    const user = await adminService.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    console.log('✓ User created:', user.uid);

    // Grant admin claims
    await adminService.setCustomClaims(user.uid, {
      admin: true,
      role: 'admin',
      permissions: ['users:read', 'users:write', 'users:delete', 'admin:all'],
    });

    console.log('✓ Admin claims set');
    console.log('\n=== First Admin Created Successfully ===');
    console.log('UID:', user.uid);
    console.log('Email:', user.email);
    console.log('Password:', password);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\nLogin with:');
    console.log(`curl -X POST http://localhost:3000/api/firebase/login \\`);
    console.log(`  -H 'Content-Type: application/json' \\`);
    console.log(`  -d '{"email":"${email}","password":"${password}"}'`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating first admin:', error);
    process.exit(1);
  }
}

createFirstAdmin();
