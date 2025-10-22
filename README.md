# FileShare - File Transfer Application

A modern, web-based file sharing application built with Node.js, Express, and Tailwind CSS. Users can upload files, view them in a dashboard, and share them via email with attachments.

## Features

- **File Upload**: Upload multiple files with progress tracking
- **File Management**: View all uploaded files with metadata (name, size, upload time)
- **File Download**: Download files directly from the dashboard
- **Email Sharing**: Share files via email with attachments and download links
- **Responsive Design**: Modern UI built with Tailwind CSS and Material Symbols
- **Dark Mode Support**: Automatic dark/light mode based on system preferences

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- GitHub account (for hosting)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/fileshare.git
cd fileshare
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables for email functionality:
Create a `.env` file in the root directory:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

3. Access the application:
- **Dashboard**: View all uploaded files at `/userdashboard.html`
- **Upload**: Upload new files at `/upload.html`
- **Download**: Download specific files at `/download.html?id=<file-id>`

## API Endpoints

- `POST /upload` - Upload a file
- `GET /files` - Get list of all files
- `GET /download/:id` - Download a specific file
- `POST /send-file` - Send a file via email

## Email Configuration

The application uses Gmail by default for sending emails. To set up:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use your Gmail address as `EMAIL_USER` and the App Password as `EMAIL_PASS`

For other email services, modify the transporter configuration in `server.js`.

## Project Structure

```
fileshare/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── login.html         # Login page (currently not functional)
├── upload.html        # File upload interface
├── download.html      # File download interface
├── userdashboard.html # Main dashboard
├── uploads/           # Uploaded files directory
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **File Handling**: Multer
- **Email**: Nodemailer
- **Icons**: Material Symbols

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- User authentication and authorization
- File expiration and cleanup
- File sharing with temporary links
- Admin dashboard for file management
- Support for different email providers
- File compression and optimization