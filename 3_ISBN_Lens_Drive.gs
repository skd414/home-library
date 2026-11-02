/**
 * ============================================================================
 * FILE 3: 3_ISBN_Lens_Drive.gs
 * 5-Server Parallel ISBN Aggregator, Compressed Image Drive Uploader & Google Lens Linker
 * ============================================================================
 */

function lookupIsbnMultiSource_(rawIsbn, rawTitle, rawAuthor) {
  const cleanIsbn = String(rawIsbn || '').replace(/[^0-9X]/gi, '').toUpperCase();
  const titleQuery = String(rawTitle || '').trim();
  const authorQuery = String(rawAuthor || '').trim();

  if (!cleanIsbn && !titleQuery) {
    return { status: 'error', message: 'Please provide an ISBN or Title to search.' };
  }

  const sourcesHit = [];
  const merged = {
    Title: '', Subtitle: '', Original_Title: '', Authors: '',
    ISBN_13: cleanIsbn.length === 13 ? cleanIsbn : '',
    ISBN_10: cleanIsbn.length === 10 ? cleanIsbn : '',
    Publisher: '', Publish_Year: '', Edition: '', Language: 'English',
    Pages: '', Genres: '', Description: '', Cover_Image_URL: '', Suggested_DDC: ''
  };

  const requests = [];
  const reqKeys = [];

  // 1. Google Books API
  let gbQuery = cleanIsbn ? `isbn:${cleanIsbn}` : `intitle:${encodeURIComponent(titleQuery)}`;
  if (!cleanIsbn && authorQuery) gbQuery += `+inauthor:${encodeURIComponent(authorQuery)}`;
  requests.push({ url: `https://www.googleapis.com/books/v1/volumes?q=${gbQuery}&maxResults=2`, muteHttpExceptions: true });
  reqKeys.push('GOOGLE_BOOKS');

  if (cleanIsbn) {
    // 2. Open Library Data API
    requests.push({ url: `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`, muteHttpExceptions: true });
    reqKeys.push('OPENLIB_DATA');

    // 3. Open Library Edition JSON
    requests.push({ url: `https://openlibrary.org/isbn/${cleanIsbn}.json`, muteHttpExceptions: true });
    reqKeys.push('OPENLIB_EDITION');

    // 4. Open Library Search Index
    requests.push({ url: `https://openlibrary.org/search.json?isbn=${cleanIsbn}&fields=title,subtitle,author_name,publisher,publish_year,number_of_pages_median,subject,language,ddc,first_sentence&limit=1`, muteHttpExceptions: true });
    reqKeys.push('OPENLIB_SEARCH');

    // 5. Internet Archive Metadata API
    const iaQuery = encodeURIComponent(`isbn:${cleanIsbn}`);
    requests.push({ url: `https://archive.org/advancedsearch.php?q=${iaQuery}&fl[]=title,creator,publisher,date,language,description,subject&output=json&rows=1`, muteHttpExceptions: true });
    reqKeys.push('INTERNET_ARCHIVE');
  } else {
    const olSearchQ = `title=${encodeURIComponent(titleQuery)}` + (authorQuery ? `&author=${encodeURIComponent(authorQuery)}` : '');
    requests.push({ url: `https://openlibrary.org/search.json?${olSearchQ}&fields=title,subtitle,author_name,publisher,publish_year,isbn,number_of_pages_median,subject,language,ddc,cover_i&limit=1`, muteHttpExceptions: true });
    reqKeys.push('OPENLIB_SEARCH');
  }

  const responses = UrlFetchApp.fetchAll(requests);
  let openLibWorkKey = '';

  responses.forEach((res, idx) => {
    const key = reqKeys[idx];
    if (res.getResponseCode() !== 200) return;

    try {
      const json = JSON.parse(res.getContentText());

      if (key === 'GOOGLE_BOOKS' && json.items && json.items.length > 0) {
        json.items.forEach(item => {
          const info = item.volumeInfo || {};
          if (!merged.Title && info.title) { merged.Title = info.title; sourcesHit.push('Google Books'); }
          if (!merged.Subtitle && info.subtitle) merged.Subtitle = info.subtitle;
          if (!merged.Authors && info.authors) merged.Authors = info.authors.join(', ');
          if (!merged.Publisher && info.publisher) merged.Publisher = info.publisher;
          if (!merged.Publish_Year && info.publishedDate) {
            const yr = String(info.publishedDate).match(/\d{4}/);
            if (yr) merged.Publish_Year = yr[0];
          }
          if (!merged.Pages && info.pageCount) merged.Pages = info.pageCount;
          if (!merged.Genres && info.categories) merged.Genres = info.categories.join(', ');
          if (!merged.Description && info.description) merged.Description = info.description;
          if (info.language && merged.Language === 'English') merged.Language = mapIsoLang_(info.language);
          if (!merged.Cover_Image_URL && info.imageLinks) {
            const img = info.imageLinks.extraLarge || info.imageLinks.large || info.imageLinks.medium || info.imageLinks.thumbnail || info.imageLinks.smallThumbnail;
            if (img) merged.Cover_Image_URL = img.replace('http://', 'https://').replace('&edge=curl', '');
          }
          (info.industryIdentifiers || []).forEach(id => {
            if (id.type === 'ISBN_13' && !merged.ISBN_13) merged.ISBN_13 = id.identifier;
            if (id.type === 'ISBN_10' && !merged.ISBN_10) merged.ISBN_10 = id.identifier;
          });
        });
      }

      if (key === 'OPENLIB_DATA') {
        const olBook = json[`ISBN:${cleanIsbn}`];
        if (olBook) {
          sourcesHit.push('Open Library Data');
          if (!merged.Title && olBook.title) merged.Title = olBook.title;
          if (!merged.Subtitle && olBook.subtitle) merged.Subtitle = olBook.subtitle;
          if (!merged.Authors && olBook.authors) merged.Authors = olBook.authors.map(a => a.name).join(', ');
          if (!merged.Publisher && olBook.publishers) merged.Publisher = olBook.publishers.map(p => p.name).join(', ');
          if (!merged.Publish_Year && olBook.publish_date) {
            const yr = String(olBook.publish_date).match(/\d{4}/);
            if (yr) merged.Publish_Year = yr[0];
          }
          if (!merged.Pages && olBook.number_of_pages) merged.Pages = olBook.number_of_pages;
          if (!merged.Genres && olBook.subjects) merged.Genres = olBook.subjects.slice(0, 4).map(s => s.name).join(', ');
          if (!merged.Cover_Image_URL && olBook.cover) merged.Cover_Image_URL = olBook.cover.large || olBook.cover.medium || '';
          if (olBook.classifications && olBook.classifications.dewey_decimal_class) merged.Suggested_DDC = olBook.classifications.dewey_decimal_class[0];
          if (!merged.Description && olBook.excerpts && olBook.excerpts.length > 0) merged.Description = olBook.excerpts[0].text;
        }
      }

      if (key === 'OPENLIB_EDITION' && json.title) {
        if (!merged.Title) merged.Title = json.title;
        if (!merged.Edition && json.edition_name) merged.Edition = json.edition_name;
        if (!merged.Pages && json.number_of_pages) merged.Pages = json.number_of_pages;
        if (!merged.Description && json.description) {
          merged.Description = typeof json.description === 'string' ? json.description : (json.description.value || '');
        }
        if (json.works && json.works.length > 0 && json.works[0].key) openLibWorkKey = json.works[0].key;
      }

      if (key === 'OPENLIB_SEARCH' && json.docs && json.docs.length > 0) {
        const doc = json.docs[0];
        sourcesHit.push('Open Library Index');
        if (!merged.Title && doc.title) merged.Title = doc.title;
        if (!merged.Subtitle && doc.subtitle) merged.Subtitle = doc.subtitle;
        if (!merged.Authors && doc.author_name) merged.Authors = doc.author_name.join(', ');
        if (!merged.Publisher && doc.publisher) merged.Publisher = doc.publisher[0];
        if (!merged.Publish_Year && doc.publish_year) merged.Publish_Year = doc.publish_year[0];
        if (!merged.Pages && doc.number_of_pages_median) merged.Pages = doc.number_of_pages_median;
        if (!merged.Genres && doc.subject) merged.Genres = doc.subject.slice(0, 4).join(', ');
        if (!merged.Suggested_DDC && doc.ddc) merged.Suggested_DDC = doc.ddc[0];
        if (!merged.Description && doc.first_sentence) {
          merged.Description = Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence;
        }
        if (!merged.Cover_Image_URL && doc.cover_i) merged.Cover_Image_URL = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      }

      if (key === 'INTERNET_ARCHIVE' && json.response && json.response.docs && json.response.docs.length > 0) {
        const ia = json.response.docs[0];
        sourcesHit.push('Internet Archive');
        if (!merged.Title && ia.title) merged.Title = ia.title;
        if (!merged.Authors && ia.creator) merged.Authors = Array.isArray(ia.creator) ? ia.creator.join(', ') : ia.creator;
        if (!merged.Publisher && ia.publisher) merged.Publisher = Array.isArray(ia.publisher) ? ia.publisher[0] : ia.publisher;
        if (!merged.Description && ia.description) merged.Description = Array.isArray(ia.description) ? ia.description.join('\n') : ia.description;
      }
    } catch (e) {}
  });

  if (!merged.Description && openLibWorkKey) {
    try {
      const workRes = UrlFetchApp.fetch(`https://openlibrary.org${openLibWorkKey}.json`, { muteHttpExceptions: true });
      if (workRes.getResponseCode() === 200) {
        const workJson = JSON.parse(workRes.getContentText());
        if (workJson.description) {
          merged.Description = typeof workJson.description === 'string' ? workJson.description : (workJson.description.value || '');
        }
      }
    } catch (e) {}
  }

  if (!merged.Cover_Image_URL && cleanIsbn) {
    merged.Cover_Image_URL = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`;
  }

  merged.Call_Number = generateCallNumber_({ ...merged, Call_Number_Mode: 'Auto' });
  merged.Call_Number_Mode = 'Auto';

  return {
    status: 'ok',
    found: Boolean(merged.Title),
    sources: [...new Set(sourcesHit)],
    book: merged
  };
}

function uploadBookImageToDrive_(data) {
  const folderId = PropertiesService.getScriptProperties().getProperty('COVERS_FOLDER_ID');
  if (!folderId) throw new Error('Run setupLMSDatabaseAndDrive() first to create the LMS_Covers folder.');

  const folder = DriveApp.getFolderById(folderId);
  const cleanBase64 = String(data.base64 || '').replace(/^data:image\/\w+;base64,/, '');
  const decoded = Utilities.base64Decode(cleanBase64);
  const safeName = String(data.fileName || 'book_image').replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + new Date().getTime() + '.jpg';

  const blob = Utilities.newBlob(decoded, data.mimeType || 'image/jpeg', safeName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId = file.getId();
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  const directImageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
  const googleLensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(directImageUrl)}`;

  return {
    status: 'ok',
    fileId: fileId,
    thumbnailUrl: thumbnailUrl,
    directImageUrl: directImageUrl,
    googleLensUrl: googleLensUrl
  };
}

function mapIsoLang_(code) {
  const map = { 'en': 'English', 'ml': 'Malayalam', 'ar': 'Arabic', 'hi': 'Hindi', 'ta': 'Tamil', 'ur': 'Urdu' };
  return map[String(code).toLowerCase()] || code;
}
