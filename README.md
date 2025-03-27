# Warranty Letter Generator Backend

This is the backend service for the Warranty Letter Generator application. It provides API endpoints for user authentication, letter management, and integration with Google Drive.

## Features

- Google OAuth authentication
- CRUD operations for letter drafts
- Real-time collaborative editing with Socket.IO
- Google Drive integration for document storage
- Secure API endpoints with validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Google Cloud Platform account with Drive API enabled
- Google service account credentials

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd warranty/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file to create your own `.env` file:

```bash
cp .env.example .env
```

Update the `.env` file with your own configuration:

- MongoDB connection string
- Google service account credentials

### 4. Start the development server

```bash
npm start
```

For development with auto-restart:

```bash
npx nodemon server.js
```

The server will start on the port specified in your `.env` file (default: 5000).

## Project Structure

