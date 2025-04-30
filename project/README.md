# ParkEase - Parking Management System

A full-stack parking management application built with React, Node.js, Express, and MySQL.

## Overview

ParkEase is a comprehensive parking management system that allows:
- Admins to manage parking locations, employees, and set rates
- Employees to check in/out vehicles at their assigned locations
- Public users to view available parking spots near them

## Tech Stack

- **Frontend**: React with TypeScript, React Router, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT

## Features

- JWT-based authentication for admins and employees
- Geolocation to find nearby parking spots
- Real-time tracking of available parking slots
- Vehicle check-in/out system with automatic cost calculation
- Admin dashboard with stats and management capabilities
- Employee dashboard for assigned parking location management
- Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MySQL server

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and configure your database connection

4. Start the development server:
   ```
   npm run dev:all
   ```

## User Credentials (Demo)

- **Admin**:
  - Email: admin@parkease.com
  - Password: admin123

- **Employee**:
  - Email: employee@parkease.com
  - Password: employee123

## Database Schema

- **users**: Stores admin and employee information
- **parking_locations**: Stores details about parking areas
- **vehicles**: Logs vehicle entries, exits, and costs
- **settings**: Stores global settings like hourly rate

## API Endpoints

The API is organized into several categories:

- **Auth**: Login and user verification
- **Admin**: Managing locations, employees, rates
- **Employee**: Vehicle check-in/out, location management
- **Public**: Access to available parking locations

## Deployment

This application is configured for easy deployment on Vercel:

1. Frontend: Deploy the build folder directly to Vercel
2. Backend: Deploy the server folder as a serverless function

## License

This project is licensed under the MIT License.