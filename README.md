# 📚 SKD Home Library & Digital Archive Management System
(made with Gemini 4 Argon High)
A full-featured, zero-cost **Home Library & Digital Preservation Archive Management System** built with **Google Sheets**, **Google Drive**, **Google Apps Script**, and an installable **Progressive Web App (PWA)** frontend hosted on **GitHub Pages**.

Designed for personal, family, and community libraries, it supports **copy-level physical tracking**, **5-server ISBN barcode auto-fetching**, **Google Lens multilingual blurb extraction** (Malayalam, Arabic, English, Hindi), **hybrid Call Number generation**, **Google Drive PDF archive reading**, **1-tap WhatsApp reminders (`wa.me`)**, and **printable Spine + QR code sticker sheets**.

---

## ✨ Key Features

### 1. 📖 Catalog & Copy-Level Inventory
* **Title vs. Physical Copy Separation:** Store master book metadata once (`1_Catalog`) while tracking multiple physical copies (`2_Copies`) with unique barcodes (`LIB-001001`, `LIB-001002`), individual shelf locations (`Room > Shelf > Row`), conditions, and lending statuses.
* **Duplicate Detection:** Automatically alerts you if an ISBN or title already exists in your catalog and offers to add a duplicate physical copy instead.
* **Multilingual Support:** Full Unicode search and display support for English, Malayalam (`മലയാളം`), Arabic (`العربية`), Hindi (`हिन्दी`), and transliterated titles.
* **Public vs. Librarian Mode:** Public visitors can browse the catalog and public digital archive in read-only mode (with purchase prices and admin tools hidden). Entering your **Librarian Admin PIN** unlocks full management tabs.

### 2. 🔍 Smart "Add Book" Workflow (5-Server ISBN + Google Lens)
* **Camera Barcode Scanner:** Uses your phone or laptop camera (`html5-qrcode`) to scan ISBN barcodes and query **5 free book servers simultaneously**:
  1. Google Books Volumes API
  2. Open Library Data API (`jscmd=data`)
  3. Open Library Edition & Works Server (for full descriptions/blurbs)
  4. Open Library Search Index (for Dewey Decimal classifications & subjects)
  5. Internet Archive Metadata Server
* **Client-Side Image Compression & Drive Storage:** Automatically compresses Front Cover and Back Cover/Blurb photos in the browser (`~150 KB`) and stores them in your `/LMS_Covers` Google Drive folder.
* **1-Click Google Lens Integration:** Generates a direct `lens.google.com` link for your uploaded cover/blurb photos so you can extract Malayalam, Arabic, or English text via Google Lens and paste it directly into the form with one tap.

### 3. 🏷️ Hybrid Call Number Engine
* **Auto Home-Library Code:** Automatically generates structured codes in the format `[LANG]-[GENRE]-[AUTHOR3]-[YEAR]` (e.g., `MAL-FIC-BAS-1944`).
* **Auto Dewey Decimal (DDC):** Pulls suggested Dewey Decimal numbers from Open Library.
* **Manual Override:** Lock in any custom classification code, with automatic copy suffixes (`c.1`, `c.2`) applied to physical copies.

### 4. 🔄 Lending (Check-Out) & Borrowing (Check-In) Desk
* **Double-Lending Prevention:** Uses Google Apps Script `LockService` to prevent issuing a copy that is already lent out or marked *Fragile/Archival Only*.
* **Loan Limits & Renewals:** Enforces per-member borrowing limits, tracks +7 day renewals, logs return conditions (*New, Good, Worn, Damaged*), and maintains a full audit trail per book and per borrower.

### 5. 💬 Zero-API WhatsApp Reminder Queue (`wa.me`)
* **Predictive Early Nudges:** Flags books due within 2 days (or 5 days early for borrowers with a history of late returns) and overdue books.
* **1-Tap Bilingual Redirect:** Opens WhatsApp directly to the borrower's chat with a pre-filled polite reminder in **English** or **Malayalam (`മലയാളം`)** and stamps the `Last_Reminded_Date` in Google Sheets.

### 6. 🏛️ Google Drive Digital Preservation Archive
* **Auto-Sync Drive Folder:** Drop scanned PDFs/eBooks of old, rare, or damaged books into your `/LMS_Digital_Archive` Google Drive folder and click **Auto-Sync** to link them to your catalog.
* **Embedded Portal Reader:** Read scanned archival books directly inside the web app without leaving the portal.

### 7. 🖨️ Printable Spine Call Number & QR Sticker Generator
* Generates A4 print-ready dual stickers featuring a **stacked Spine Call Number** on the left and a **scannable QR Code + Copy ID + Shelf Location** on the right.

---
 Step-by-Step Implementation Guide
Part 1: Set Up the Google Sheets Database & Apps Script Backend
1. Create the Google Sheet:
  - Go to sheets.new and name the file Home_Library_LMS_Database.
2. Add the Backend Script:
  - In the top menu, click Extensions > Apps Script.
  - Delete any default code in Code.gs, paste the complete backend script, and click Save (💾).
3. Run the One-Click Installer:
  - In the top toolbar of the Apps Script editor, select setupLMSDatabaseAndDrive from the function dropdown and click Run.
  - Click Review Permissions > select your Google account > Advanced > Go to project (unsafe) > Allow.
  - Verify that all 6 color-coded tabs appear in your Google Sheet and Home_Library_LMS_Storage appears in your Google Drive.
4. Set Your Librarian Admin PIN:
  - In the Apps Script left sidebar, click Project Settings (⚙️).
  - Scroll down to Script Properties > click Add script property:
    - Property: ADMIN_PIN
    - Value: Your secret 4–6 digit PIN (e.g., 1234)
  - Click Save script properties.
5. Deploy as a Web App API:
  - Click Deploy (top right) > New deployment.
  - Click the gear icon next to Select type and choose Web app.
  - Set Execute as: Me
  - Set Who has access: Anyone (Required for CORS communication from GitHub Pages; all write operations remain protected by your ADMIN_PIN).
  - Click Deploy and copy the Web App URL (https://script.google.com/macros/s/.../exec).
Important Note on Updating Code.gs: Whenever you make changes to Code.gs in the future, click Deploy > Manage deployments > Edit (✏️) > Version: New version > Deploy.
Part 2: Host the Web App on GitHub Pages
1. Create a GitHub Repository:
  - Create a new Public repository on GitHub (e.g., home-library).
2. Upload the 3 Frontend Files:
  - Add index.html, manifest.json, and sw.js to the root of your repository and commit your changes.
3. Enable GitHub Pages:
  - Go to your repository's Settings > Pages (on the left sidebar).
  - Under Build and deployment > Branch, select main (folder: /root) and click Save.
  - Wait ~60 seconds and open your live site at https://<your-username>.github.io/home-library/.
Part 3: Connect & Install on Android and Windows
1. Link Your Backend API:
  - Open your live GitHub Pages URL.
  - Click ⚙️ Login in the top-right corner.
  - Paste your Apps Script Web App URL (/exec) and your Librarian Admin PIN, then click Save & Connect.
2. Install as a Standalone App:
  - Windows (Chrome / Edge): Click the 📲 Install button in the top navigation bar (or the install icon in your browser's address bar) to add the app to your Desktop and Start Menu.
  - Android (Chrome): Open the site on your phone and tap 📲 Install (or Three Dots > Install app) to add it to your home screen with full camera barcode scanning support.
🛠️ Daily Usage Workflow
1. Adding Books (➕ Add Book):
  - Tap 📷 Scan ISBN Barcode (or type an ISBN/Title) and click 🔍 Auto-Fetch Book Details.
  - Snap/upload the Front Cover and Back Cover/Blurb photos.
  - For regional books (Malayalam/Arabic) or missing blurbs, click 🔍 Extract Text with Google Lens ↗, copy the text in Google Lens, return to the app, and tap 📋 Paste Copied Text into Blurb.
  - Select your Call Number mode (Auto Home-Code, Auto DDC, or Manual), assign the Room / Shelf / Row, and click 💾 Save Book & Generate Copy ID.
2. Printing Stickers (🏷️ Labels):
  - Open the 🏷️ Labels tab, click 🔄 Generate QR Codes, and click 🖨️ Print Sticker Sheet (A4 / PDF).
3. Issuing & Returning Books (🔄 Lending Desk):
  - Check-Out: Scan the book's QR sticker (or select from the dropdown), choose the borrower, and click ✅ Issue Book Now.
  - Check-In: Scan the returned book's QR sticker, verify its physical condition, and click 📥 Complete Return.
4. Sending Reminders (💬 WhatsApp):
  - Choose English or മലയാളം (Malayalam) and click 📲 Send WhatsApp Redirect to message borrowers with upcoming or overdue books.
5. Backing Up Data (📥 Backup):
  - Click 📥 Backup in the top navigation bar anytime to download a complete CSV snapshot of your catalog.
🔒 Security & Privacy
- Zero Credentials in Code: Neither your Google Sheet ID, Web App URL, nor your Admin PIN are hardcoded in the GitHub repository.
- Client Storage: The Web App URL is saved locally in your browser's localStorage, and your Admin PIN is stored only in temporary sessionStorage (automatically cleared when the browser tab closes).
- Public View Protection: Without the Admin PIN, all write endpoints in Code.gs reject modifications (401 Unauthorized), and public API snapshots strip out sensitive member details, active loan logs, and book purchase prices.
---

## 🏗️ System Architecture & Repository Files

```text
├── index.html       # Complete Single-Page Web App (Tailwind CSS + Alpine.js + QR Scanner/Generator)
├── manifest.json    # PWA Web App Manifest (enables installation on Android & Windows)
├── sw.js            # Minimal Network Pass-Through Service Worker (triggers browser "Install App" prompt)
└── README.md        # Project documentation and setup guide



