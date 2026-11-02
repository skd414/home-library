/**
 * ============================================================================
 * FILE 1: 1_Database_Setup.gs
 * Database Schema & One-Click Google Sheets + Google Drive Installer
 * ============================================================================
 */

const SCHEMA = {
  '1_Catalog': [
    'Book_ID', 'Call_Number', 'Call_Number_Mode', 'ISBN_13', 'ISBN_10',
    'Title', 'Subtitle', 'Original_Title', 'Authors', 'Publisher',
    'Publish_Year', 'Edition', 'Language', 'Item_Type', 'Pages',
    'Genres', 'Tags', 'Description', 'Series_ID', 'Series_Order',
    'Cover_Image_URL', 'Blurb_Image_URL', 'Has_Digital_Copy',
    'Created_At', 'Updated_At'
  ],
  '2_Copies': [
    'Copy_ID', 'Book_ID', 'Copy_Call_Number', 'Room', 'Shelf',
    'Row_Position', 'Condition', 'Status', 'Purchase_Date',
    'Purchase_Price', 'Currency', 'Acquired_From', 'Notes',
    'Photo_Folder_URL', 'Last_Audited_Date'
  ],
  '3_Members': [
    'Member_ID', 'Full_Name', 'Relationship', 'Role', 'Phone_WhatsApp',
    'Email', 'PIN_Hash', 'Max_Loan_Limit', 'Digital_Archive_Access',
    'Trust_Score', 'Avg_Days_Late', 'Active_Loans_Count', 'Status'
  ],
  '4_Transactions': [
    'Txn_ID', 'Copy_ID', 'Book_ID', 'Member_ID', 'Issue_Date',
    'Due_Date', 'Return_Date', 'Renewal_Count', 'Issue_Condition',
    'Return_Condition', 'Fine_Amount', 'Fine_Paid', 'Last_Reminded_Date',
    'Status', 'Notes'
  ],
  '9_Audit_Log': [
    'Log_ID', 'Timestamp', 'Actor_Member_ID', 'Action_Type',
    'Target_Table', 'Target_ID', 'Previous_Value_JSON', 'New_Value_JSON'
  ],
  '10_Digital_Archive': [
    'Digital_ID', 'Book_ID', 'Source_Copy_ID', 'Drive_File_ID',
    'Drive_View_URL', 'Drive_Download_URL', 'File_Format', 'File_Size_MB',
    'Page_Count', 'Scan_Resolution_DPI', 'OCR_Status', 'Preservation_Reason',
    'Access_Level', 'Uploaded_Date'
  ]
};

/**
 * Run this function once to initialize all Sheet tabs and Google Drive folders.
 */
function setupLMSDatabaseAndDrive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();

  Object.keys(SCHEMA).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    const headers = SCHEMA[sheetName];
    const currentHeaders = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];

    if (currentHeaders.join(',') !== headers.join(',')) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
           .setBackground('#1e293b')
           .setFontColor('#ffffff')
           .setFontWeight('bold')
           .setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }
  });

  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  const rootFolder = getOrCreateFolder_('Home_Library_LMS_Storage', DriveApp.getRootFolder());
  const coversFolder = getOrCreateFolder_('LMS_Covers', rootFolder);
  const archiveFolder = getOrCreateFolder_('LMS_Digital_Archive', rootFolder);
  const reportsFolder = getOrCreateFolder_('LMS_Labels_Reports', rootFolder);

  props.setProperties({
    'SPREADSHEET_ID': ss.getId(),
    'ROOT_FOLDER_ID': rootFolder.getId(),
    'COVERS_FOLDER_ID': coversFolder.getId(),
    'ARCHIVE_FOLDER_ID': archiveFolder.getId(),
    'REPORTS_FOLDER_ID': reportsFolder.getId(),
    'NEXT_COPY_SEQ': props.getProperty('NEXT_COPY_SEQ') || '1001'
  });

  const memberSheet = ss.getSheetByName('3_Members');
  if (memberSheet.getLastRow() === 1) {
    const ownerEmail = Session.getActiveUser().getEmail() || 'librarian@localhost';
    memberSheet.appendRow([
      'MEM-ADMIN-01', 'Library Owner (Admin)', 'Owner', 'Admin',
      '', ownerEmail, '', 999, 'Full', 100, 0, 0, 'Active'
    ]);
  }

  Logger.log('SUCCESS: Database tabs and Google Drive folders are ready!');
}

function getOrCreateFolder_(folderName, parentFolder) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}
