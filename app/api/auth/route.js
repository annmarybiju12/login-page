import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { username, password, email, phone } = await request.json();

    // Check if the request is for registration or login
    if (request.url.includes('/register')) {
      // Registration flow
      if (!username || !password || !email || !phone) {
        return NextResponse.json(
          { error: "All fields (username, password, email, phone) are required" },
          { status: 400 }
        );
      }

      const client = await clientPromise;
      const db = client.db("loginApp");

      // Check if the user already exists by username
      const existingUser = await db.collection("users").findOne({ username });
      if (existingUser) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 }
        );
      }

      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      await db.collection("users").insertOne({
        username,
        password: hashedPassword,
        email,
        phone,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "Registration successful. Please log in."
      });

    } else {
      // Login flow
      if (!username || !password) {
        return NextResponse.json(
          { error: "Username and password are required" },
          { status: 400 }
        );
      }

      const client = await clientPromise;
      const db = client.db("loginApp");

      // Find the user by username
      const user = await db.collection("users").findOne({ username });

      if (!user) {
        return NextResponse.json(
          { error: "Invalid username or password" },
          { status: 401 }
        );
      }

      // Compare the provided password with the hashed password stored in DB
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid username or password" },
          { status: 401 }
        );
      }

      // Generate JWT token for the user
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return NextResponse.json({
        success: true,
        token,
        username: user.username,
        email: user.email || 'Not provided',
        phone: user.phone || 'Not provided'
      });
    }

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: "An error occurred during authentication" },
      { status: 500 }
    );
  }
}
