# Medical Clinic Security Project — Vulnerable Version
A vulnerable web application and its secured version, demonstrating common web vulnerabilities and their mitigation.

## 1) Project Overview:
This project is a deliberately vulnerable Medical Clinic web application developed for cybersecurity education and penetration testing practice.

The application simulates a medical clinic environment where users can manage patients, appointments, medical records, reports, and other clinic-related functionality.

The vulnerable version intentionally contains several common web application security vulnerabilities. These vulnerabilities are designed to be identified and exploited in an isolated lab environment using penetration testing tools and techniques.

## 2) Technologies Used
Node.js

Express.js

MongoDB

SQLite

Mongoose

Handlebars

HTML

CSS

JavaScript

JWT Authentication

bcrypt

Better-SQLite3

## **3) Team Members:**

**Abdelrahman Mohamed Elbahgy**: Penetration testing & Exploitation

**Seif Haytham Ali**: Penetration Testing & Exploitation

**Seif Khaled Othman**: Analysis & Remediation

**Fady Nasser Ramlah**: Analysis & Remediation 

**Adel George Adel**: Documentation



## **4) How to Run the Project**
### Prerequisites

**Make sure the following are installed:**
Node.js
npm
MongoDB

Check the installed versions:
node -v
npm -v
mongod --version

### **1. Clone the Repository**
git clone <REPOSITORY_URL>
cd Medical-Clinic-Security-Project/vulnerable-version

### **2. Install Dependencies**
Navigate to the backend directory:
cd backend
npm install

### **3. Configure Environment Variables**
Create a .env file based on the provided .env.example:
MONGODB_URI=mongodb://localhost:27017/medical-clinic
JWT_SECRET=your-development-secret
PORT=5000
((Do not use real production credentials))

### **4. Start MongoDB**
Make sure MongoDB is running locally.

For Linux systems:
sudo systemctl start mongod

Check its status:
sudo systemctl status mongod

### **5. Seed the Database**
If the project contains a seed script:
npm run seed
This initializes the required application data.


### **6. Start the Backend**
npm start

The backend should become available on:
http://localhost:5000
The exact port may vary depending on the .env configuration.

## **5) Vulnerabilities Implemented:**
#### 1. Server-Side Template Injection (SSTI)
#### 2. Server-Side Request Forgery (SSRF)
#### 3. Command Injection
#### 4. Path Traversal
#### 5. SQL Injection
#### 6. Cross-Site Request Forgery (CSRF)
#### 7. Information Disclosure

## **6) Security flags**
The vulnerable application contains a seven-part flag chain associated with the vulnerabilities.

The flags are intentionally included as part of the cybersecurity lab and should only be used in the isolated project environment.

## NOTE: **Security Warning**

This version is intentionally vulnerable.

Do not deploy this application to the public Internet or use it with real patient information, credentials, or production databases.

The application should only be executed in an isolated testing/laboratory environment.
