/**
 * ============================================================================
 * FILE 5: 5_Archive_WhatsApp.gs
 * WhatsApp Reminder Queue (wa.me), Digital Archive Drive Sync & Database Helpers
 * ============================================================================
 */

function getWhatsAppReminderQueue_() {
  const txns = getTableData_('4_Transactions');
  const catalog = getTableData_('1_Catalog');
  const copies = getTableData_('2_Copies');
  const members = getTableData_('3_Members');
  const todayMs = new Date(new Date().toISOString().substring(0, 10)).getTime();
  const queue = [];

  txns.forEach(t => {
    if (t.Status !== 'Active' && t.Status !== 'Overdue') return;
    const member = members.find(m => m.Member_ID === t.Member_ID);
    const book = catalog.find(b => b.Book_ID === t.Book_ID);
    const copy = copies.find(c => c.Copy_ID === t.Copy_ID);
    if (!member || !book) return;

    const dueMs = new Date(t.Due_Date).getTime();
    const daysUntilDue = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
    const nudgeThreshold = Number(member.Avg_Days_Late || 0) >= 4 ? 5 : 2;

    if (daysUntilDue <= nudgeThreshold) {
      const cleanPhone = String(member.Phone_WhatsApp || '').replace(/[^0-9]/g, '');
      const isOverdue = daysUntilDue < 0;
      const callNo = copy ? copy.Copy_Call_Number : book.Call_Number;

      const msg = isOverdue
        ? `Hi ${member.Full_Name}, friendly reminder from SKD Home Library! The book *"${book.Title}"* (${callNo}) was due on *${String(t.Due_Date).substring(0,10)}*. Please let me know when you can return it or if you need an extension.`
        : `Hi ${member.Full_Name}, quick reminder from SKD Home Library! The book *"${book.Title}"* (${callNo}) is due on *${String(t.Due_Date).substring(0,10)}*. Let me know if you'd like to renew it!`;

      queue.push({
        Txn_ID: t.Txn_ID,
        Member_Name: member.Full_Name,
        Phone_WhatsApp: cleanPhone,
        Book_Title: book.Title,
        Call_Number: callNo,
        Due_Date: t.Due_Date,
        Days_Until_Due: daysUntilDue,
        Urgency: isOverdue ? 'OVERDUE' : 'DUE_SOON',
        Last_Reminded_Date: t.Last_Reminded_Date || 'Never',
        WhatsApp_Redirect_URL: cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : '',
        Message_Preview: msg
      });
    }
  });

  return { status: 'ok', count: queue.length, reminders: queue };
}

function markReminderSent_(txnId) {
  const txns = getTableData_('4_Transactions');
  const txn = txns.find(t => t.Txn_ID === txnId);
  if (!txn) throw new Error('Transaction not found.');
  txn.Last_Reminded_Date = new Date().toISOString().substring(0, 10);
  upsertRow_('4_Transactions', 'Txn_ID', txn);
  return { status: 'ok', txnId: txnId };
}

function syncDriveArchive_(actorId) {
  const archiveFolderId = PropertiesService.getScriptProperties().getProperty('ARCHIVE_FOLDER_ID');
  if (!archiveFolderId) throw new Error('Run setupLMSDatabaseAndDrive() first.');

  const folder = DriveApp.getFolderById(archiveFolderId);
  const files = folder.getFiles();
  const existingArchives = getTableData_('10_Digital_Archive');
  const catalog = getTableData_('1_Catalog');
  let newlyLinked = 0;

  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    if (existingArchives.some(a => a.Drive_File_ID === fileId)) continue;

    const fileName = file.getName();
    const baseName = fileName.replace(/\.[^/.]+$/, '').trim();
    const ext = fileName.split('.').pop().toUpperCase();
    const sizeMb = (file.getSize() / (1024 * 1024)).toFixed(2);

    let matchedBook = catalog.find(b =>
      baseName.toLowerCase().includes(String(b.Title).toLowerCase()) ||
      (b.Call_Number && baseName.toLowerCase().includes(String(b.Call_Number).toLowerCase()))
    );

    if (!matchedBook) {
      matchedBook = addOrUpdateBook_({
        Title: baseName,
        Item_Type: 'Archival Scan',
        Has_Digital_Copy: true,
        createInitialCopy: false
      }, actorId).book;
    } else {
      matchedBook.Has_Digital_Copy = true;
      upsertRow_('1_Catalog', 'Book_ID', matchedBook);
    }

    const archiveRecord = {
      Digital_ID: 'DIG-' + Utilities.getUuid().substring(0, 8).toUpperCase(),
      Book_ID: matchedBook.Book_ID,
      Source_Copy_ID: '',
      Drive_File_ID: fileId,
      Drive_View_URL: `https://drive.google.com/file/d/${fileId}/preview`,
      Drive_Download_URL: `https://drive.google.com/uc?export=download&id=${fileId}`,
      File_Format: ext,
      File_Size_MB: sizeMb,
      Page_Count: '',
      Scan_Resolution_DPI: '300',
      OCR_Status: 'Unverified',
      Preservation_Reason: 'Damaged/Old Physical Copy Scan',
      Access_Level: 'Family_Members',
      Uploaded_Date: new Date().toISOString().substring(0, 10)
    };

    upsertRow_('10_Digital_Archive', 'Digital_ID', archiveRecord);
    newlyLinked++;
  }

  return { status: 'ok', newlyLinkedCount: newlyLinked };
}

function linkDigitalCopy_(data, actorId) {
  const digitalId = data.Digital_ID || ('DIG-' + Utilities.getUuid().substring(0, 8).toUpperCase());
  const match = String(data.Drive_File_ID || data.Drive_URL || '').match(/[-\w]{25,}/);
  const fileId = match ? match[0] : '';
  if (!fileId) throw new Error('Valid Google Drive File ID or Share Link required.');

  const record = {
    Digital_ID: digitalId,
    Book_ID: data.Book_ID,
    Source_Copy_ID: data.Source_Copy_ID || '',
    Drive_File_ID: fileId,
    Drive_View_URL: `https://drive.google.com/file/d/${fileId}/preview`,
    Drive_Download_URL: `https://drive.google.com/uc?export=download&id=${fileId}`,
    File_Format: data.File_Format || 'PDF',
    File_Size_MB: data.File_Size_MB || '',
    Page_Count: data.Page_Count || '',
    Scan_Resolution_DPI: '300',
    OCR_Status: 'Searchable Text',
    Preservation_Reason: data.Preservation_Reason || 'Archival Backup',
    Access_Level: 'Public_View',
    Uploaded_Date: new Date().toISOString().substring(0, 10)
  };

  upsertRow_('10_Digital_Archive', 'Digital_ID', record);
  const book = getTableData_('1_Catalog').find(b => b.Book_ID === data.Book_ID);
  if (book) {
    book.Has_Digital_Copy = true;
    upsertRow_('1_Catalog', 'Book_ID', book);
  }
  logAudit_(actorId, 'LINK_DIGITAL_ARCHIVE', '10_Digital_Archive', digitalId, null, record);
  return { status: 'ok', digitalRecord: record };
}

function getInitialSnapshot_(role) {
  const isGuest = (role === 'Guest');
  const catalog = getTableData_('1_Catalog');
  const copies = getTableData_('2_Copies').map(c => {
    if (isGuest) {
      const clone = { ...c };
      delete clone.Purchase_Price;
      return clone;
    }
    return c;
  });

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    catalog: catalog,
    copies: copies,
    digitalArchive: getTableData_('10_Digital_Archive'),
    members: isGuest ? [] : getTableData_('3_Members'),
    transactions: isGuest ? [] : getTableData_('4_Transactions')
  };
}

function addOrUpdateMember_(data, actorId) {
  const memberId = data.Member_ID || ('MEM-' + Utilities.getUuid().substring(0, 6).toUpperCase());
  const record = {
    Member_ID: memberId,
    Full_Name: data.Full_Name,
    Relationship: data.Relationship || 'Friend',
    Role: data.Role || 'Member',
    Phone_WhatsApp: String(data.Phone_WhatsApp || '').replace(/[^0-9]/g, ''),
    Email: data.Email || '',
    PIN_Hash: '',
    Max_Loan_Limit: data.Max_Loan_Limit || 3,
    Digital_Archive_Access: 'View_Only',
    Trust_Score: data.Trust_Score || 100,
    Avg_Days_Late: data.Avg_Days_Late || 0,
    Active_Loans_Count: data.Active_Loans_Count || 0,
    Status: 'Active'
  };
  upsertRow_('3_Members', 'Member_ID', record);
  logAudit_(actorId, 'UPSERT_MEMBER', '3_Members', memberId, null, record);
  return { status: 'ok', member: record };
}

function getTableData_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });
}

function upsertRow_(sheetName, pkColumn, recordObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = SCHEMA[sheetName];
  const lastRow = sheet.getLastRow();
  const pkIndex = headers.indexOf(pkColumn);
  const rowArray = headers.map(h => (recordObj[h] !== undefined ? recordObj[h] : ''));

  if (lastRow > 1) {
    const pkValues = sheet.getRange(2, pkIndex + 1, lastRow - 1, 1).getValues().flat();
    const matchIndex = pkValues.findIndex(v => String(v) === String(recordObj[pkColumn]));
    if (matchIndex !== -1) {
      sheet.getRange(matchIndex + 2, 1, 1, headers.length).setValues([rowArray]);
      return;
    }
  }
  sheet.appendRow(rowArray);
}

function logAudit_(actorId, actionType, targetTable, targetId, oldVal, newVal) {
  try {
    upsertRow_('9_Audit_Log', 'Log_ID', {
      Log_ID: 'LOG-' + Utilities.getUuid().substring(0, 8),
      Timestamp: new Date().toISOString(),
      Actor_Member_ID: actorId || 'SYSTEM',
      Action_Type: actionType,
      Target_Table: targetTable,
      Target_ID: targetId,
      Previous_Value_JSON: oldVal ? JSON.stringify(oldVal) : '',
      New_Value_JSON: newVal ? JSON.stringify(newVal) : ''
    });
  } catch (e) {}
}
