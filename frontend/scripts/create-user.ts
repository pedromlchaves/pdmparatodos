// Run this with npx ts-node scripts/create-user.ts
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createTestUser() {

  // Edit accordingly
  const email = "test@example.com";
  const password = "password123";

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("Test user already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email,
        password: hashedPassword,
      },
    });

    console.log("Test user created successfully:", user);
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

