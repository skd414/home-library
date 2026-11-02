/**
 * ============================================================================
 * FILE 2: 2_Router_API.gs
 * Web App HTTP GET & POST Routers with PIN Verification
 * ============================================================================
 */

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
    const role = (e && e.parameter && e.parameter.role) ? e.parameter.role : 'Guest';

    switch (action) {
      case 'ping':
        return jsonResponse_({ status: 'ok', message: 'SKD Library API Online', timestamp: new Date().toISOString() });
      case 'getInitialSnapshot':
        return jsonResponse_(getInitialSnapshot_(role));
      case 'getWhatsAppQueue':
        return jsonResponse_(getWhatsAppReminderQueue_());
      case 'lookupIsbn':
        return jsonResponse_(lookupIsbnMultiSource_(e.parameter.isbn, e.parameter.title, e.parameter.author));
      default:
        return jsonResponse_({ status: 'error', message: 'Unknown GET action: ' + action });
    }
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const actorId = payload.actorId || 'MEM-ADMIN-01';

    const savedPin = PropertiesService.getScriptProperties().getProperty('ADMIN_PIN');
    if (savedPin && payload.pin !== savedPin) {
      return jsonResponse_({ status: 'error', code: 401, message: 'Invalid Admin PIN.' });
    }

    switch (action) {
      case 'lookupIsbn':
        return jsonResponse_(lookupIsbnMultiSource_(payload.data.isbn, payload.data.title, payload.data.author));
      case 'uploadBookImage':
        return jsonResponse_(uploadBookImageToDrive_(payload.data));
      case 'addOrUpdateBook':
        return jsonResponse_(addOrUpdateBook_(payload.data, actorId));
      case 'addPhysicalCopy':
        return jsonResponse_(addPhysicalCopy_(payload.data, actorId));
      case 'checkoutBook':
        return jsonResponse_(checkoutBook_(payload.data, actorId));
      case 'returnBook':
        return jsonResponse_(returnBook_(payload.data, actorId));
      case 'renewLoan':
        return jsonResponse_(renewLoan_(payload.data, actorId));
      case 'deleteRecord':
        return jsonResponse_(deleteRecord_(payload.data, actorId));
      case 'addOrUpdateMember':
        return jsonResponse_(addOrUpdateMember_(payload.data, actorId));
      case 'syncDriveArchive':
        return jsonResponse_(syncDriveArchive_(actorId));
      case 'linkDigitalCopy':
        return jsonResponse_(linkDigitalCopy_(payload.data, actorId));
      case 'markReminderSent':
        return jsonResponse_(markReminderSent_(payload.txnId));
      default:
        return jsonResponse_({ status: 'error', message: 'Unknown POST action: ' + action });
    }
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() });
  }
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
