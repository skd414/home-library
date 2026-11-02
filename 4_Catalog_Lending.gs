/**
 * ============================================================================
 * FILE 4: 4_Catalog_Lending.gs
 * Hybrid Call Number Engine, Catalog/Copies CRUD, Check-Out, Check-In & Renewals
 * ============================================================================
 */

function generateCallNumber_(bookData) {
  if (bookData.Call_Number_Mode === 'Manual' && bookData.Call_Number && String(bookData.Call_Number).trim() !== '') {
    return String(bookData.Call_Number).trim();
  }
  if (bookData.Call_Number_Mode === 'DDC' && bookData.Call_Number) {
    return String(bookData.Call_Number).trim();
  }

  const langMap = {
    'malayalam': 'MAL', 'മലയാളം': 'MAL',
    'arabic': 'ARA', 'العربية': 'ARA',
    'english': 'ENG', 'hindi': 'HIN', 'हिन्दी': 'HIN',
    'sanskrit': 'SAN', 'urdu': 'URD', 'tamil': 'TAM'
  };
  const rawLang = String(bookData.Language || 'ENG').toLowerCase().trim();
  const langCode = langMap[rawLang] || rawLang.substring(0, 3).toUpperCase() || 'GEN';
  const rawGenre = String(bookData.Genres || 'GEN').split(',')[0].trim();
  const genreCode = rawGenre.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
  const rawAuthor = String(bookData.Authors || 'UNK').split(',')[0].trim();
  const authorParts = rawAuthor.split(/\s+/);
  const surname = authorParts[authorParts.length - 1].replace(/[^a-zA-Z]/g, '');
  const authorCode = (surname.substring(0, 3) || 'AUT').toUpperCase();
  const yearCode = bookData.Publish_Year ? String(bookData.Publish_Year).substring(0, 4) : 'ND';

  return `${langCode}-${genreCode}-${authorCode}-${yearCode}`;
}

function addOrUpdateBook_(data, actorId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const catalog = getTableData_('1_Catalog');
    const now = new Date().toISOString();

    if (!data.Book_ID && !data.forceCreateNewTitle) {
      const cleanIsbn13 = String(data.ISBN_13 || '').replace(/[^0-9X]/gi, '');
      const cleanTitle = String(data.Title || '').toLowerCase().trim();
      const existing = catalog.find(row => {
        const rowIsbn13 = String(row.ISBN_13 || '').replace(/[^0-9X]/gi, '');
        if (cleanIsbn13 && rowIsbn13 === cleanIsbn13) return true;
        if (cleanTitle && String(row.Title || '').toLowerCase().trim() === cleanTitle) return true;
        return false;
      });
      if (existing) {
        return { status: 'duplicate_detected', existingBook: existing };
      }
    }

    const isUpdate = Boolean(data.Book_ID);
    const bookId = data.Book_ID || 'BK-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const callNumberMode = data.Call_Number_Mode || 'Auto';
    const callNumber = generateCallNumber_({ ...data, Call_Number_Mode: callNumberMode });

    const bookRecord = {
      Book_ID: bookId,
      Call_Number: callNumber,
      Call_Number_Mode: callNumberMode,
      ISBN_13: data.ISBN_13 || '',
      ISBN_10: data.ISBN_10 || '',
      Title: data.Title || 'Untitled',
      Subtitle: data.Subtitle || '',
      Original_Title: data.Original_Title || '',
      Authors: Array.isArray(data.Authors) ? data.Authors.join(', ') : (data.Authors || 'Unknown'),
      Publisher: data.Publisher || '',
      Publish_Year: data.Publish_Year || '',
      Edition: data.Edition || '',
      Language: data.Language || 'English',
      Item_Type: data.Item_Type || 'Book',
      Pages: data.Pages || '',
      Genres: Array.isArray(data.Genres) ? data.Genres.join(', ') : (data.Genres || ''),
      Tags: Array.isArray(data.Tags) ? data.Tags.join(', ') : (data.Tags || ''),
      Description: data.Description || '',
      Series_ID: data.Series_ID || '',
      Series_Order: data.Series_Order || '',
      Cover_Image_URL: data.Cover_Image_URL || '',
      Blurb_Image_URL: data.Blurb_Image_URL || '',
      Has_Digital_Copy: Boolean(data.Has_Digital_Copy),
      Created_At: data.Created_At || now,
      Updated_At: now
    };

    upsertRow_('1_Catalog', 'Book_ID', bookRecord);
    logAudit_(actorId, isUpdate ? 'UPDATE' : 'CREATE', '1_Catalog', bookId, null, bookRecord);

    let createdCopy = null;
    if (!isUpdate && data.createInitialCopy !== false) {
      createdCopy = addPhysicalCopy_({
        Book_ID: bookId,
        Base_Call_Number: callNumber,
        Room: data.Room || 'Main Room',
        Shelf: data.Shelf || 'Shelf A',
        Row_Position: data.Row_Position || 'Row 1',
        Condition: data.Condition || 'Good',
        Status: data.Status || 'Available',
        Purchase_Date: data.Purchase_Date || now.substring(0, 10),
        Purchase_Price: data.Purchase_Price || '',
        Currency: data.Currency || 'INR'
      }, actorId).copy;
    }

    return { status: 'ok', book: bookRecord, copy: createdCopy };
  } finally {
    lock.releaseLock();
  }
}

function addPhysicalCopy_(data, actorId) {
  const copies = getTableData_('2_Copies');
  const existingCopies = copies.filter(c => c.Book_ID === data.Book_ID);
  const copyIndex = existingCopies.length + 1;

  const props = PropertiesService.getScriptProperties();
  let nextSeq = parseInt(props.getProperty('NEXT_COPY_SEQ') || '1001', 10);
  const copyId = data.Copy_ID || ('LIB-' + String(nextSeq).padStart(6, '0'));
  if (!data.Copy_ID) props.setProperty('NEXT_COPY_SEQ', String(nextSeq + 1));

  let baseCall = data.Base_Call_Number;
  if (!baseCall) {
    const book = getTableData_('1_Catalog').find(b => b.Book_ID === data.Book_ID);
    baseCall = book ? book.Call_Number : 'UNCLASSIFIED';
  }

  const copyRecord = {
    Copy_ID: copyId,
    Book_ID: data.Book_ID,
    Copy_Call_Number: data.Copy_Call_Number || `${baseCall} c.${copyIndex}`,
    Room: data.Room || 'Main Room',
    Shelf: data.Shelf || 'Shelf A',
    Row_Position: data.Row_Position || 'Row 1',
    Condition: data.Condition || 'Good',
    Status: data.Status || 'Available',
    Purchase_Date: data.Purchase_Date || new Date().toISOString().substring(0, 10),
    Purchase_Price: data.Purchase_Price || '',
    Currency: data.Currency || 'INR',
    Acquired_From: data.Acquired_From || '',
    Notes: data.Notes || '',
    Photo_Folder_URL: data.Photo_Folder_URL || '',
    Last_Audited_Date: new Date().toISOString().substring(0, 10)
  };

  upsertRow_('2_Copies', 'Copy_ID', copyRecord);
  logAudit_(actorId, 'CREATE_COPY', '2_Copies', copyId, null, copyRecord);
  return { status: 'ok', copy: copyRecord };
}

function checkoutBook_(data, actorId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const copies = getTableData_('2_Copies');
    const members = getTableData_('3_Members');

    const copy = copies.find(c => String(c.Copy_ID).trim() === String(data.Copy_ID).trim());
    if (!copy) throw new Error(`Copy ID "${data.Copy_ID}" not found.`);
    if (copy.Status !== 'Available') throw new Error(`Copy "${copy.Copy_ID}" is currently "${copy.Status}".`);
    if (copy.Condition === 'Fragile/Archival Only') throw new Error('Fragile archival copies cannot be lent out.');

    const member = members.find(m => String(m.Member_ID).trim() === String(data.Member_ID).trim());
    if (!member) throw new Error('Member not found.');

    const activeLoans = Number(member.Active_Loans_Count || 0);
    const maxLimit = Number(member.Max_Loan_Limit || 3);
    if (activeLoans >= maxLimit && !data.overrideLimit) {
      throw new Error(`${member.Full_Name} has reached their loan limit (${activeLoans}/${maxLimit}).`);
    }

    const issueDate = data.Issue_Date || new Date().toISOString().substring(0, 10);
    const loanDays = Number(data.Loan_Days || 14);
    const dueObj = new Date(issueDate);
    dueObj.setDate(dueObj.getDate() + loanDays);
    const dueDate = data.Due_Date || dueObj.toISOString().substring(0, 10);

    const txnId = 'TXN-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const txnRecord = {
      Txn_ID: txnId,
      Copy_ID: copy.Copy_ID,
      Book_ID: copy.Book_ID,
      Member_ID: member.Member_ID,
      Issue_Date: issueDate,
      Due_Date: dueDate,
      Return_Date: '',
      Renewal_Count: 0,
      Issue_Condition: copy.Condition,
      Return_Condition: '',
      Fine_Amount: 0,
      Fine_Paid: false,
      Last_Reminded_Date: '',
      Status: 'Active',
      Notes: data.Notes || ''
    };

    upsertRow_('4_Transactions', 'Txn_ID', txnRecord);
    copy.Status = 'Lent';
    upsertRow_('2_Copies', 'Copy_ID', copy);
    member.Active_Loans_Count = activeLoans + 1;
    upsertRow_('3_Members', 'Member_ID', member);

    logAudit_(actorId, 'CHECKOUT', '4_Transactions', txnId, null, txnRecord);
    return { status: 'ok', transaction: txnRecord, updatedCopy: copy };
  } finally {
    lock.releaseLock();
  }
}

function returnBook_(data, actorId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const txns = getTableData_('4_Transactions');
    const copies = getTableData_('2_Copies');
    const members = getTableData_('3_Members');

    const activeTxn = txns.find(t =>
      (t.Status === 'Active' || t.Status === 'Overdue') &&
      (String(t.Copy_ID) === String(data.Copy_ID) || String(t.Txn_ID) === String(data.Txn_ID))
    );
    if (!activeTxn) throw new Error(`No active loan found for Copy "${data.Copy_ID}".`);

    const copy = copies.find(c => String(c.Copy_ID) === String(activeTxn.Copy_ID));
    const member = members.find(m => String(m.Member_ID) === String(activeTxn.Member_ID));

    const returnDate = data.Return_Date || new Date().toISOString().substring(0, 10);
    const returnCondition = data.Return_Condition || (copy ? copy.Condition : activeTxn.Issue_Condition);

    const dueMs = new Date(activeTxn.Due_Date).getTime();
    const returnMs = new Date(returnDate).getTime();
    const daysLate = Math.max(0, Math.floor((returnMs - dueMs) / (1000 * 60 * 60 * 24)));

    activeTxn.Return_Date = returnDate;
    activeTxn.Return_Condition = returnCondition;
    activeTxn.Status = 'Returned';
    if (data.Notes) activeTxn.Notes = (activeTxn.Notes ? activeTxn.Notes + ' | ' : '') + data.Notes;
    upsertRow_('4_Transactions', 'Txn_ID', activeTxn);

    if (copy) {
      copy.Condition = returnCondition;
      copy.Status = 'Available';
      upsertRow_('2_Copies', 'Copy_ID', copy);
    }

    if (member) {
      member.Active_Loans_Count = Math.max(0, Number(member.Active_Loans_Count || 1) - 1);
      const prevAvgLate = Number(member.Avg_Days_Late || 0);
      member.Avg_Days_Late = Math.round(((prevAvgLate * 2) + daysLate) / 3);
      member.Trust_Score = daysLate > 0
        ? Math.max(10, Number(member.Trust_Score || 100) - Math.min(15, daysLate * 2))
        : Math.min(100, Number(member.Trust_Score || 100) + 2);
      upsertRow_('3_Members', 'Member_ID', member);
    }

    logAudit_(actorId, 'CHECKIN', '4_Transactions', activeTxn.Txn_ID, null, activeTxn);
    return { status: 'ok', transaction: activeTxn, daysLate: daysLate };
  } finally {
    lock.releaseLock();
  }
}

function renewLoan_(data, actorId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const txns = getTableData_('4_Transactions');
    const txn = txns.find(t => String(t.Txn_ID) === String(data.Txn_ID));
    if (!txn) throw new Error('Transaction not found.');

    const extraDays = Number(data.Extra_Days || 7);
    const currentDue = new Date(txn.Due_Date || new Date());
    currentDue.setDate(currentDue.getDate() + extraDays);

    txn.Due_Date = currentDue.toISOString().substring(0, 10);
    txn.Renewal_Count = Number(txn.Renewal_Count || 0) + 1;
    txn.Status = 'Active';

    upsertRow_('4_Transactions', 'Txn_ID', txn);
    logAudit_(actorId, 'RENEW_LOAN', '4_Transactions', txn.Txn_ID, null, txn);
    return { status: 'ok', transaction: txn };
  } finally {
    lock.releaseLock();
  }
}

function deleteRecord_(data, actorId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(data.table);
    if (!sheet) throw new Error('Invalid table name.');
    const headers = SCHEMA[data.table];
    const pkIndex = headers.indexOf(data.pkColumn);
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) throw new Error('Table is empty.');

    const pkValues = sheet.getRange(2, pkIndex + 1, lastRow - 1, 1).getValues().flat();
    const matchIdx = pkValues.findIndex(v => String(v) === String(data.id));
    if (matchIdx === -1) throw new Error('Record ID not found.');

    sheet.deleteRow(matchIdx + 2);
    logAudit_(actorId, 'DELETE', data.table, data.id, { deletedId: data.id }, null);
    return { status: 'ok', deletedId: data.id };
  } finally {
    lock.releaseLock();
  }
}
