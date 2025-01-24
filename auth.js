const jwt = require('jsonwebtoken');
const db = require("./db");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10; // Number of salt rounds for hashing

require('dotenv').config();
// require('dotenv').config(); // Load environment variables from .env

// Ensure SECRET_KEY is fetched properly
const SECRET_KEY = process.env.SECRET_KEY;   

function registerUser({ name, username, password }) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
      if (err) {
        console.error("Error hashing password:", err);
        reject(err);
      } else {
        console.log("Hashed password generated:", hashedPassword);
        db.run(
          "INSERT INTO users (name, username, password) VALUES (?, ?, ?)",
          [name, username, hashedPassword], // Store name along with username and password
          function (err) {
            if (err) {
              if (err.code === "SQLITE_CONSTRAINT") {
                console.error("Username already exists");
                resolve({ success: false, message: "Username already exists" });
              } else {
                console.error("Database error:", err);
                reject(err);
              }
            } else {
              console.log("User registered successfully");
              resolve({ success: true });
            }
          }
        );
      }
    });
  });
}

// Authenticate a user and return a JWT
function authenticateUser({ username, password }) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          // Compare the provided password with the hashed password in the database
          bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
              reject(err);
            } else if (result) {
              // Generate a JWT token
              const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });
              console.log('Generated JWT Token:', token); // Debug log
              resolve({ success: true, token, message: "Login successful" });
            } else {
              console.error('Invalid credentials');
              resolve({ success: false, message: "Invalid credentials" });
            }
          });
        } else {
          console.error('User not found');
          resolve({ success: false, message: "User not found" });
        }
      }
    );
  });
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    console.log("Token received for verification:", token);

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        console.error("Token verification error:", err);
        reject({ success: false, message: "Token invalid or expired" });
      } else {
        console.log("Decoded token payload:", decoded);
        resolve({ success: true, username: decoded.username });
      }
    });
  });
}



module.exports = { registerUser, authenticateUser, verifyToken };
