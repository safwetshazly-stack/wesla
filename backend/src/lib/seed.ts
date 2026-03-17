/**
 * Wasla — Database Seed Script
 * تشغيل: npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Wasla database...')

  // ─── System settings ─────────────────────────────────
  await prisma.systemSetting.createMany({
    data: [
      { key: 'platform_fee_percent', value: 10 },
      { key: 'fixed_fee_egp', value: 5 },
      { key: 'fixed_fee_threshold', value: 50 },
      { key: 'min_withdrawal_egp', value: 100 },
      { key: 'max_wallet_balance_egp', value: 5000 },
      { key: 'max_session_duration_minutes', value: 120 },
      { key: 'session_auto_complete_hours', value: 24 },
    ],
    skipDuplicates: true,
  })

  const hash = await bcrypt.hash('Test1234', 12)

  // ─── Admin ────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@wasla.eg' },
    update: {},
    create: {
      email: 'admin@wasla.eg',
      phoneNumber: '01000000000',
      fullName: 'مدير وصلة',
      passwordHash: hash,
      userType: 'ADMIN',
      verificationStatus: 'VERIFIED',
    },
  })

  // ─── Helpers ──────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'ahmed@wasla.eg' },
    update: {},
    create: {
      email: 'ahmed@wasla.eg',
      phoneNumber: '01111111111',
      fullName: 'أحمد محمد',
      passwordHash: hash,
      userType: 'HELPER',
      verificationStatus: 'VERIFIED',
      bio: 'مطور ويب خبير | React · Node.js · 5+ سنوات خبرة',
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      skills: ['برمجة ومواقع', 'React', 'Node.js', 'تطوير تطبيقات'],
      experienceLevel: 'EXPERT',
      hourlyRateEgp: 100,
      ratingAvg: 4.8,
      totalSessions: 47,
      totalEarningsEgp: 4230,
      responseTimeMinutes: 15,
      languages: ['العربية', 'الإنجليزية'],
      walletBalanceEgp: 2300,
      availability: {
        saturday: ['10:00-12:00', '18:00-22:00'],
        sunday: ['18:00-22:00'],
        monday: ['18:00-22:00'],
        tuesday: ['18:00-22:00'],
      },
    },
  })

  await prisma.user.upsert({
    where: { email: 'sara@wasla.eg' },
    update: {},
    create: {
      email: 'sara@wasla.eg',
      phoneNumber: '01222222222',
      fullName: 'سارة أحمد',
      passwordHash: hash,
      userType: 'HELPER',
      verificationStatus: 'VERIFIED',
      bio: 'مدرّسة رياضيات وفيزياء للثانوية والجامعة',
      governorate: 'الجيزة',
      city: 'الدقي',
      skills: ['تدريس خصوصي', 'رياضيات', 'فيزياء'],
      experienceLevel: 'INTERMEDIATE',
      hourlyRateEgp: 60,
      ratingAvg: 4.9,
      totalSessions: 128,
      totalEarningsEgp: 6912,
      responseTimeMinutes: 10,
      languages: ['العربية'],
      walletBalanceEgp: 1500,
    },
  })

  await prisma.user.upsert({
    where: { email: 'omar@wasla.eg' },
    update: {},
    create: {
      email: 'omar@wasla.eg',
      phoneNumber: '01333333333',
      fullName: 'عمر خالد',
      passwordHash: hash,
      userType: 'HELPER',
      verificationStatus: 'VERIFIED',
      bio: 'مصمم جرافيك محترف | Figma · Adobe Suite',
      governorate: 'الإسكندرية',
      skills: ['تصميم جرافيك', 'Figma', 'UI/UX', 'Adobe Photoshop'],
      experienceLevel: 'EXPERT',
      hourlyRateEgp: 80,
      ratingAvg: 4.7,
      totalSessions: 63,
      totalEarningsEgp: 4536,
      responseTimeMinutes: 20,
      languages: ['العربية', 'الإنجليزية'],
      walletBalanceEgp: 800,
    },
  })

  // ─── Seeker ───────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'user@wasla.eg' },
    update: {},
    create: {
      email: 'user@wasla.eg',
      phoneNumber: '01444444444',
      fullName: 'محمد علي',
      passwordHash: hash,
      userType: 'SEEKER',
      verificationStatus: 'VERIFIED',
      walletBalanceEgp: 500,
    },
  })

  console.log('✅ Database seeded successfully!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 Demo Accounts — Password: Test1234')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👑 Admin   → admin@wasla.eg')
  console.log('🧑‍💼 Helper  → ahmed@wasla.eg')
  console.log('🧑‍💼 Helper  → sara@wasla.eg')
  console.log('🧑‍💼 Helper  → omar@wasla.eg')
  console.log('🙋 Seeker  → user@wasla.eg')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('💡 OTP in dev mode → check terminal logs')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
