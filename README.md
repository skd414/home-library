# 📚 Home Library & Digital Archive Management System (LMS)

A lightweight, serverless **Home Library & Digital Archive Management System** (LMS) powered by **Google Sheets**, **Google Drive**, **Google Apps Script**, and a responsive **Flat Design Progressive Web App (PWA)**. 

Designed for personal and home libraries supporting multilingual cataloging (**English, Malayalam, Arabic, Hindi**), camera barcode/QR scanning, interactive 4-point book cover perspective cropping, physical copy tracking, custom WhatsApp reminders (`wa.me`), and an embedded Google Drive PDF Archive reader.
Github works as a host website only, ALL THE DATAS AS ARE SECURE AND STORED IN THE PERSONAL GOOGLE ACCOUNT ECOSYSTEM ONLY (Sheets, Appscript, Drive)
Made purely with the help of Gemini AI - 4 Argon (High)

---

## ✨ Key Features

### 1. 24-Field Multilingual Catalog & Copy-Level Inventory
* **Dual Titles:** Store both the English/Transliterated title and the Original Script title (e.g., മലയാളം, العربية, हिन्दी).
* **24 Metadata Fields:** Book ID, English Title, Original Title, Book Type (Normal / Series / Volume), Series Name, Volume Number, Author(s), Publisher, ISBN, Edition, Language, Category/Genre, Publication Year, Pages, Format, Shelf Location, Date Acquired, Purchase Price, Reading Status, Book Condition, Star Rating, Notes/Remarks, Blurb, Front Cover, and Back Cover.
* **Copy-Level Tracking:** Separates master book metadata (`1_Catalog`) from physical copies (`2_Copies`), assigning each physical book a unique **Accession Number** (`LIB-01001`) and **Call Number**.
* **Smart Auto-Suggest & Categorization:** Automatically builds dropdown suggestions for previously entered Authors and Publishers. Click any Author, Publisher, or Category tag to filter the catalog.
* **Interactive DDC Guide:** Built-in Dewey Decimal Classification (DDC) quick-reference chart for manual or automated call numbers.

### 2. Smart AI Auto-Add & 4-Point Perspective Crop/Warp
* **3-Stage Metadata Pipeline:**
  1. **ISBN Barcode Scan:** Decodes EAN-13/ISBN-10 barcodes via mobile/desktop camera and queries **Google Books API** and **Open Library API** (free, no cost).
  2. **Gemini 2.5 Flash Multilingual Vision OCR:** For regional or older books without barcodes, extracts title, author, publisher, price, and back-cover blurb from photos.
  3. **Interactive 4-Point Crop & Perspective Warp:** Built-in HTML5 canvas homography tool lets you drag 4 corner handles (`TL`, `TR`, `BR`, `BL`) over angled book photos to flatten and crop Front and Back covers before uploading to Google Drive.

### 3. Direct Lending Desk, History & Zero-API WhatsApp Alerts
* **1-Click Direct Lending:** Lend or return books directly from the Catalog card or the Lending Desk (with inline **"+ New Borrower"** creation).
* **Full Transaction History:** View borrowing history per individual book or browse the global transaction log.
* **Custom WhatsApp Templates (`wa.me`):** Edit custom templates with placeholders (`[Member_Name]`, `[Book_Title]`, `[Accession_Number]`, `[Issue_Date]`, `[Due_Date]`) for 1-tap WhatsApp redirects without paid APIs.

### 4. Digital Preservation Archive (Google Drive PDF Integration)
* Upload scanned PDFs of old, rare, or fragile books directly through the web app or auto-sync an entire `/LMS_Digital_Archive` Google Drive folder.
* Read scanned PDFs directly inside the portal's embedded viewer.

### 5. Space-Saving A4 Spine/QR Stickers & Data Export
* **Ultra-Dense Printable Stickers:** Print up to ~88 minimalist stickers per A4 sheet (`3mm` margins) containing **Call Number**, **QR Code**, and **Accession Number** only.
* **View Switcher & Custom Branding:** Toggle between **Card**, **Deck**, and **List** views, customize your Library Name and Profile Picture, and export data anytime to **CSV (UTF-8)** or **JSON**.

---

## 🛠️ Step-by-Step Setup Guide (For Personal Use)

### Step 1: Set Up the Google Sheets Database & Apps Script Backend
1. Create a new Google Sheet at [sheets.new](https://sheets.new) and name it **`Home_Library_Database`**.
2. In the top menu, click **Extensions** → **Apps Script**.
3. Delete any default code in `Code.gs`, paste the entire contents of [`backend/Code.gs`](./backend/Code.gs), and click **Save (💾)**.
4. From the function dropdown menu at the top of the Apps Script editor, select **`setupRevampedLMS`** and click **Run**.
   * Click **Review Permissions** → select your Google account → click **Advanced** → **Go to project (unsafe)** → **Allow**.
   * This automatically creates and formats all **7 database tabs** and creates your Google Drive storage folders (`/SKD_Home_Library_Storage/LMS_Covers` and `/LMS_Digital_Archive`).

### Step 2: Configure Your Secret PIN & Free Gemini API Key
1. In the Apps Script editor, click **Project Settings (⚙️)** on the left sidebar.
2. Scroll down to **Script Properties** and click **Add script property**:
   * **Property 1:** `ADMIN_PIN` → Value: Set a 4–6 digit secret PIN (e.g., `1234`). This protects all write/edit/lending actions.
   * **Property 2:** `GEMINI_API_KEY` → Value: Paste your free API key from [Google AI Studio](https://aistudio.google.com/apikey) (used for multilingual photo OCR).
3. Click **Save script properties**.

### Step 3: Deploy the Backend as a Web App API
1. In the top right of the Apps Script editor, click **Deploy** → **New deployment**.
2. Click the gear icon next to *Select type* and choose **Web app**.
3. Set the following options:
   * **Description:** `LMS Backend API`
   * **Execute as:** `Me`
   * **Who has access:** `Anyone`
4. Click **Deploy** and copy the generated **Web App URL** (ending in `/exec`).

### Step 4: Host the Frontend on GitHub Pages (Free)
1. Fork or upload `index.html`, `manifest.json`, and `sw.js` to your GitHub repository.
2. Go to your repository's **Settings** → **Pages**.
3. Under **Build and deployment** → **Branch**, select **`main`** (root `/`) and click **Save**.
4. Wait ~60 seconds and open your live URL: `https://<your-username>.github.io/<repo-name>/`.

### Step 5: Connect & Install on Android and Windows
1. Open your GitHub Pages website and click **🔒 Login** in the top right.
2. Paste your Apps Script **Web App URL (`/exec`)** and your **`ADMIN_PIN`**, then click **Save & Connect**.
   * *Public Visitors:* Anyone opening your link without entering the PIN will see the **Public Catalog (Read-Only)** without shelf locations, prices, or lending controls.
3. Click **📲 Install** in the header (or browser address bar) to install the portal as a standalone app on **Android** or **Windows**.
