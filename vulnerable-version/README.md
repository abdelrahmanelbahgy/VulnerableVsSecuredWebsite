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
#### **1. Server-Side Template Injection (SSTI):** The vulnerable version allowed unsafe template processing.
#### **2. Server-Side Request Forgery (SSRF):** The vulnerable version accepts an arbitrary URL and performs a server-side request.
#### **3. Command Injection:** The vulnerable implementation directly concatenates user input into a system command
#### **4. Path Traversal:** The vulnerable report download functionality uses user-controlled filenames to construct file paths.
#### **5. SQL Injection:** The vulnerable patient-search endpoint directly concatenates user input into an SQL statement.
#### **6. Cross-Site Request Forgery (CSRF):** The vulnerable application does not adequately verify the origin of state-changing requests.
#### **7. Information Disclosure:** he vulnerable version exposes the backup directory through static file serving.This could expose configuration and other sensitive files. 

## **6) Security Fixes Applied:**
#### **1. Server-Side Template Injection (SSTI):**
The secured version separates template structure from user-controlled data and avoids treating untrusted input as a Handlebars template.
User-controlled values are handled as data rather than executable template content.

User-controlled values are handled as data rather than executable template content.
#### **2. Server-Side Request Forgery (SSRF):** 
The secured implementation validates the supplied URL before making the request.
#### **3. Command Injection:**
The secured implementation validates the hostname/IP address and avoids constructing shell commands from raw user input.
Where system commands are required, arguments are passed separately rather than through a shell command string.
#### **4. Path Traversal:**
The secured version validates requested filenames and restricts file access to the intended reports directory.
Path normalization and directory-boundary checks are used to prevent access outside the allowed directory.
#### **5. SQL Injection:**
The secured version uses parameterized/prepared SQL statements instead of string concatenation.
Instead of constructing SQL using raw input, the user-controlled value is passed as a query parameter.
#### **6. Cross-Site Request Forgery (CSRF):**
The secured version applies CSRF protection to sensitive state-changing operations.
#### **7. Information Disclosure:**
The secured version removes public access to backup files and prevents sensitive configuration files from being served as static resources.
Sensitive configuration is stored outside publicly accessible directories and secrets are provided through environment variables or secure configuration mechanisms.


## **7) Security flags**
The vulnerable application contains a seven-part flag chain associated with the vulnerabilities.

The flags are intentionally included as part of the cybersecurity lab and should only be used in the isolated project environment.

## NOTE: **Security Warning**

This version is intentionally vulnerable.

Do not deploy this application to the public Internet or use it with real patient information, credentials, or production databases.

The application should only be executed in an isolated testing/laboratory environment.
