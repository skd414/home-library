Step-by-Step Implementation Guide
Part 1: Set Up the Google Sheets Database & Apps Script Backend
Create the Google Sheet:

Go to sheets.new and name the file Home_Library_LMS_Database.

Add the Backend Script:

In the top menu, click Extensions > Apps Script.

Delete any default code in Code.gs, paste the complete backend script, and click Save (💾).

Run the One-Click Installer:

In the top toolbar of the Apps Script editor, select setupLMSDatabaseAndDrive from the function dropdown and click Run.

Click Review Permissions > select your Google account > Advanced > Go to project (unsafe) > Allow.

Verify that all 6 color-coded tabs appear in your Google Sheet and Home_Library_LMS_Storage appears in your Google Drive.

Set Your Librarian Admin PIN:

In the Apps Script left sidebar, click Project Settings (⚙️).

Scroll down to Script Properties > click Add script property:

Property: ADMIN_PIN

Value: Your secret 4–6 digit PIN (e.g., 1234)

Click Save script properties.

Deploy as a Web App API:

Click Deploy (top right) > New deployment.

Click the gear icon next to Select type and choose Web app.

Set Execute as: Me

Set Who has access: Anyone (Required for CORS communication from GitHub Pages; all write operations remain protected by your ADMIN_PIN).

Click Deploy and copy the Web App URL (https://script.google.com/macros/s/.../exec).

Important Note on Updating Code.gs: Whenever you make changes to Code.gs in the future, click Deploy > Manage deployments > Edit (✏️) > Version: New version > Deploy.

Part 2: Host the Web App on GitHub Pages
Create a GitHub Repository:

Create a new Public repository on GitHub (e.g., home-library).

Upload the 3 Frontend Files:

Add index.html, manifest.json, and sw.js to the root of your repository and commit your changes.

Enable GitHub Pages:

Go to your repository's Settings > Pages (on the left sidebar).

Under Build and deployment > Branch, select main (folder: /root) and click Save.

Wait ~60 seconds and open your live site at https://<your-username>.github.io/home-library/.

Part 3: Connect & Install on Android and Windows
Link Your Backend API:

Open your live GitHub Pages URL.

Click ⚙️ Login in the top-right corner.

Paste your Apps Script Web App URL (/exec) and your Librarian Admin PIN, then click Save & Connect.

Install as a Standalone App:

Windows (Chrome / Edge): Click the 📲 Install button in the top navigation bar (or the install icon in your browser's address bar) to add the app to your Desktop and Start Menu.

Android (Chrome): Open the site on your phone and tap 📲 Install (or Three Dots > Install app) to add it to your home screen with full camera barcode scanning support.

🛠️ Daily Usage Workflow
Adding Books (➕ Add Book):

Tap 📷 Scan ISBN Barcode (or type an ISBN/Title) and click 🔍 Auto-Fetch Book Details.

Snap/upload the Front Cover and Back Cover/Blurb photos.

For regional books (Malayalam/Arabic) or missing blurbs, click 🔍 Extract Text with Google Lens ↗, copy the text in Google Lens, return to the app, and tap 📋 Paste Copied Text into Blurb.

Select your Call Number mode (Auto Home-Code, Auto DDC, or Manual), assign the Room / Shelf / Row, and click 💾 Save Book & Generate Copy ID.

Printing Stickers (🏷️ Labels):

Open the 🏷️ Labels tab, click 🔄 Generate QR Codes, and click 🖨️ Print Sticker Sheet (A4 / PDF).

Issuing & Returning Books (🔄 Lending Desk):

Check-Out: Scan the book's QR sticker (or select from the dropdown), choose the borrower, and click ✅ Issue Book Now.

Check-In: Scan the returned book's QR sticker, verify its physical condition, and click 📥 Complete Return.

Sending Reminders (💬 WhatsApp):

Choose English or മലയാളം (Malayalam) and click 📲 Send WhatsApp Redirect to message borrowers with upcoming or overdue books.

Backing Up Data (📥 Backup):

Click 📥 Backup in the top navigation bar anytime to download a complete CSV snapshot of your catalog.

🔒 Security & Privacy
Zero Credentials in Code: Neither your Google Sheet ID, Web App URL, nor your Admin PIN are hardcoded in the GitHub repository.

Client Storage: The Web App URL is saved locally in your browser's localStorage, and your Admin PIN is stored only in temporary sessionStorage (automatically cleared when the browser tab closes).

Public View Protection: Without the Admin PIN, all write endpoints in Code.gs reject modifications (401 Unauthorized), and public API snapshots strip out sensitive member details, active loan logs, and book purchase prices.
