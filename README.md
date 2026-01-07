# Bebo Designer X - Simple Order Backend

This repository contains a small Express backend that accepts order submissions (form fields + files), generates a PDF summary of the order server-side, stores uploaded files and generated PDFs, and returns a download URL. The frontend has been updated to POST orders to this backend and include the returned PDF link in a WhatsApp message.

Usage

1. Install dependencies:

   npm install

2. Run the server:

   npm start

   or for development:

   npm run dev

3. Default server runs on port 3000. The backend exposes:

   POST /api/orders  - accepts multipart/form-data: fields (service, pages, language, topic, details, phone) and files (up to 10 files, 10MB each)
   GET /pdfs/:file   - serves generated PDFs
   GET /files/:file  - serves uploaded files

Security & Production notes

- This is a minimal example. For production, consider:
  - Storing uploads and PDFs in durable cloud storage (S3) and not on the instance filesystem.
  - Adding authentication for the admin side and access control for download links.
  - Adding virus scanning on uploaded files, rate limiting, and request validation.
  - Using HTTPS and proper CORS policies.
