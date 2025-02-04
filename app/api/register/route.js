import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, password, email, phone } = await request.json();
    
    // Check if all fields are provided
    if (!username || !password || !email || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate username (length: 3-15 characters, only alphabets, numbers, and underscores)
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Username must be between 3 and 15 characters and can only contain letters, numbers, and underscores." },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Validate phone number (must be exactly 10 digits and not start with 0)
    const phoneRegex = /^(?!0)[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 digits and cannot start with 0" },
        { status: 400 }
      );
    }

    // Validate email (must contain @ and end with .com)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || !email.endsWith('.com')) {
      return NextResponse.json(
        { error: "Email must be valid and end with .com" },
        { status: 400 }
      );
    }

    // Connect to MongoDB client and check if the user already exists
    const client = await clientPromise;
    const db = client.db("loginApp");

    // Check if username exists
    const existingUserByUsername = await db.collection("users").findOne({ username });
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingUserByEmail = await db.collection("users").findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Check if phone number exists
    const existingUserByPhone = await db.collection("users").findOne({ phone });
    if (existingUserByPhone) {
      return NextResponse.json(
        { error: "Mobile number already registered, try using another number" },
        { status: 400 }
      );
    }

    // Hash password and create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
      username,
      password: hashedPassword,
      email,
      phone,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful",
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
