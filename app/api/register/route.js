import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Validate username and password
    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("loginApp");
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }
    
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
      username,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      message: "Registration successful" 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
} 