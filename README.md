# 📚 SKD Home Library & Digital Archive Management System

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

## 🏗️ System Architecture & Repository Files

```text
├── index.html       # Complete Single-Page Web App (Tailwind CSS + Alpine.js + QR Scanner/Generator)
├── manifest.json    # PWA Web App Manifest (enables installation on Android & Windows)
├── sw.js            # Minimal Network Pass-Through Service Worker (triggers browser "Install App" prompt)
└── README.md        # Project documentation and setup guide
