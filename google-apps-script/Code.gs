/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT - AE TRAINING 2026 INTEGRATION ENDPOINT
 * ==============================================================================
 * Fungsi:
 * 1. doGet(): Memeriksa koneksi, membaca data peserta lama, dan riwayat import.
 * 2. doPost(): Menerima permintaan import absensi dan menyimpannya sebagai baris baru.
 * 3. Idempotent & Aman: Memeriksa tab IMPORT_LOG agar responseId tidak ganda.
 * 4. NIK Bukan Kunci Duplikasi: Peserta yang sama boleh hadir di tanggal berbeda.
 * ==============================================================================
 */

// Konfigurasi default (Dapat diatur melalui Script Properties)
var DEFAULT_CONFIG = {
  // Ganti via Script Properties atau ganti string di bawah ini jika tidak menggunakan Script Properties:
  SPREADSHEET_ID: "", // ID Spreadsheet Google Anda
  TARGET_SHEET_NAME: "Form Responses 1", // Tab utama data peserta
  LOG_SHEET_NAME: "IMPORT_LOG", // Tab riwayat log import
  API_SECRET_TOKEN: "myrep-ae-training-2026-sec", // Token keamanan request
};

/**
 * Mendapatkan konfigurasi aktif dari Script Properties atau fallback default
 */
function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    SPREADSHEET_ID: props.getProperty("SPREADSHEET_ID") || DEFAULT_CONFIG.SPREADSHEET_ID,
    TARGET_SHEET_NAME: props.getProperty("TARGET_SHEET_NAME") || DEFAULT_CONFIG.TARGET_SHEET_NAME,
    LOG_SHEET_NAME: props.getProperty("LOG_SHEET_NAME") || DEFAULT_CONFIG.LOG_SHEET_NAME,
    API_SECRET_TOKEN: props.getProperty("API_SECRET_TOKEN") || DEFAULT_CONFIG.API_SECRET_TOKEN,
  };
}

/**
 * Membuka Spreadsheet aman dengan verifikasi konfigurasi
 */
function getSpreadsheet_() {
  var config = getConfig_();
  if (!config.SPREADSHEET_ID || config.SPREADSHEET_ID.trim() === "") {
    // Jika belum diset di properties, coba gunakan active spreadsheet jika script menempel pada file
    try {
      return SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      throw new Error("SPREADSHEET_ID belum dikonfigurasi pada Script Properties.");
    }
  }
  return SpreadsheetApp.openById(config.SPREADSHEET_ID.trim());
}

/**
 * Memastikan tab IMPORT_LOG tersedia tanpa mengubah tab data utama
 */
function getOrCreateLogSheet_(ss) {
  var config = getConfig_();
  var logSheet = ss.getSheetByName(config.LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(config.LOG_SHEET_NAME);
    // Buat header log khusus
    logSheet.appendRow([
      "response_id",
      "import_time",
      "file_name",
      "full_name",
      "nik",
      "training_date",
      "status",
      "error_message"
    ]);
    // Format header
    var headerRange = logSheet.getRange(1, 1, 1, 8);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#F3ECF8");
  }
  return logSheet;
}

/**
 * Mengambil daftar ID respons yang sudah sukses diimpor sebelumnya
 */
function getExistingImportedIds_(logSheet) {
  var lastRow = logSheet.getLastRow();
  var ids = {};
  if (lastRow > 1) {
    var data = logSheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < data.length; i++) {
      var rId = String(data[i][0]).trim();
      var status = String(data[i][6]).trim().toLowerCase();
      // Hanya kunci yang berstatus 'success' yang ditandai terimpor
      if (rId && (status === "success" || status === "imported")) {
        ids[rId] = true;
      }
    }
  }
  return ids;
}

/**
 * ==============================================================================
 * HANDLER GET: Membaca data dan cek koneksi
 * Endpoint: ?action=check | getParticipants | getImportHistory
 * ==============================================================================
 */
function doGet(e) {
  var output = {
    success: false,
    timestamp: new Date().toISOString(),
  };

  try {
    var params = e ? e.parameter : {};
    var action = params.action || "check";
    var token = params.token || "";
    var config = getConfig_();

    // Verifikasi Token Keamanan (jika dikonfigurasi)
    if (config.API_SECRET_TOKEN && token !== config.API_SECRET_TOKEN) {
      output.error = "Unauthorized: Token API tidak valid atau tidak disertakan.";
      return createJsonResponse_(output, 401);
    }

    if (action === "check" || action === "checkConnection") {
      var conn = checkConnection();
      output = Object.assign(output, conn);
    } else if (action === "getParticipants") {
      var partRes = getParticipants();
      output = Object.assign(output, partRes);
    } else if (action === "getImportHistory") {
      var histRes = getImportHistory();
      output = Object.assign(output, histRes);
    } else {
      output.error = "Aksi '" + action + "' tidak dikenali.";
    }
  } catch (err) {
    output.error = err.message || "Terjadi kesalahan internal server Google Apps Script.";
  }

  return createJsonResponse_(output, 200);
}

/**
 * ==============================================================================
 * HANDLER POST: Menerima data import absensi baru
 * ==============================================================================
 */
function doPost(e) {
  var output = {
    success: false,
    timestamp: new Date().toISOString(),
  };

  try {
    var config = getConfig_();
    var postDataStr = "";
    if (e && e.postData && e.postData.contents) {
      postDataStr = e.postData.contents;
    }

    if (!postDataStr) {
      output.error = "Payload body kosong.";
      return createJsonResponse_(output, 400);
    }

    var payload = JSON.parse(postDataStr);
    var token = payload.token || (e.parameter ? e.parameter.token : "");

    // Verifikasi Token
    if (config.API_SECRET_TOKEN && token !== config.API_SECRET_TOKEN) {
      output.error = "Unauthorized: Token API tidak valid.";
      return createJsonResponse_(output, 401);
    }

    var action = payload.action || "importAttendance";

    if (action === "importAttendance") {
      var importRes = importAttendance(payload.records || [], payload.meta || {});
      output = Object.assign(output, importRes);
    } else {
      output.error = "Aksi POST '" + action + "' tidak didukung.";
    }
  } catch (err) {
    output.error = err.message || "Gagal memproses data POST di Google Apps Script.";
  }

  return createJsonResponse_(output, 200);
}

/**
 * ==============================================================================
 * FUNGSI 1: checkConnection()
 * Memeriksa kesiapan Spreadsheet, nama tab, dan hak akses
 * ==============================================================================
 */
function checkConnection() {
  var ss = getSpreadsheet_();
  var config = getConfig_();
  var targetSheet = ss.getSheetByName(config.TARGET_SHEET_NAME);

  var availableSheets = [];
  var allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) {
    availableSheets.push(allSheets[i].getName());
  }

  return {
    success: true,
    connected: true,
    spreadsheetTitle: ss.getName(),
    spreadsheetId: ss.getId(),
    targetSheetName: config.TARGET_SHEET_NAME,
    targetSheetExists: Boolean(targetSheet),
    availableSheets: availableSheets,
    totalParticipants: targetSheet ? Math.max(0, targetSheet.getLastRow() - 1) : 0,
    message: targetSheet
      ? "Koneksi ke spreadsheet utama Google Sheets berhasil."
      : "Koneksi spreadsheet berhasil, tetapi tab '" + config.TARGET_SHEET_NAME + "' belum ditemukan. Silakan sesuaikan nama tab di pengaturan.",
  };
}

/**
 * ==============================================================================
 * FUNGSI 2: getParticipants()
 * Mengambil data peserta lama dari spreadsheet utama
 * ==============================================================================
 */
function getParticipants() {
  var ss = getSpreadsheet_();
  var config = getConfig_();
  var sheet = ss.getSheetByName(config.TARGET_SHEET_NAME);

  if (!sheet) {
    return {
      success: false,
      error: "Tab target '" + config.TARGET_SHEET_NAME + "' tidak ditemukan.",
      participants: [],
      headers: [],
    };
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < 1 || lastCol < 1) {
    return {
      success: true,
      participants: [],
      headers: [],
      total: 0,
    };
  }

  // Baca seluruh data baris (termasuk header baris 1)
  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var rawHeaders = rawValues[0].map(function (h) {
    return String(h).trim();
  });

  var participants = [];
  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    // Lewati jika seluruh baris kosong
    var isRowEmpty = row.every(function (cell) {
      return cell === "" || cell === null || cell === undefined;
    });
    if (isRowEmpty) continue;

    // Simpan objek terstruktur dinamis mengikuti header yang ada
    var record = {
      _rowNumber: r + 1,
    };

    for (var c = 0; c < rawHeaders.length; c++) {
      var headerKey = rawHeaders[c] || "Col_" + (c + 1);
      var val = row[c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
      }
      record[headerKey] = val !== undefined && val !== null ? String(val).trim() : "";
    }

    participants.push(record);
  }

  return {
    success: true,
    total: participants.length,
    headers: rawHeaders,
    participants: participants,
  };
}

/**
 * ==============================================================================
 * FUNGSI 3: importAttendance(records, meta)
 * Menambahkan data baru sebagai baris baru ke spreadsheet utama
 * Tidak menimpa / menghapus data lama.
 * Mencatat ke tab IMPORT_LOG dan menolak responseId ganda.
 * ==============================================================================
 */
function importAttendance(records, meta) {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      success: false,
      error: "Tidak ada data record yang dikirim untuk diimpor.",
      insertedCount: 0,
      skippedCount: 0,
    };
  }

  var ss = getSpreadsheet_();
  var config = getConfig_();
  var targetSheet = ss.getSheetByName(config.TARGET_SHEET_NAME);

  if (!targetSheet) {
    return {
      success: false,
      error: "Tab target '" + config.TARGET_SHEET_NAME + "' tidak ditemukan.",
      insertedCount: 0,
      skippedCount: 0,
    };
  }

  var logSheet = getOrCreateLogSheet_(ss);
  var importedIds = getExistingImportedIds_(logSheet);

  var targetHeaders = [];
  var lastCol = targetSheet.getLastColumn();
  if (lastCol > 0) {
    targetHeaders = targetSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
      return String(h).trim();
    });
  }

  var insertedRows = [];
  var logRows = [];
  var insertedCount = 0;
  var skippedCount = 0;
  var nowStr = new Date().toISOString();
  var fileName = meta && meta.fileName ? meta.fileName : "Upload_Manual";

  for (var i = 0; i < records.length; i++) {
    var item = records[i];
    var rId = String(item.responseId || "").trim();
    var norm = item.normalized || {};

    // 1. Cek duplikasi ID respons yang sudah sukses diimpor
    if (rId && importedIds[rId]) {
      skippedCount++;
      continue;
    }

    // 2. Susun baris sesuai urutan header spreadsheet utama yang ada
    var rowData = [];
    for (var h = 0; h < targetHeaders.length; h++) {
      var colName = targetHeaders[h];
      var lowerCol = colName.toLowerCase();
      var cellVal = "";

      // Pemetaan cerdas ke field yang dinormalisasi
      if (lowerCol.includes("timestamp") || lowerCol.includes("waktu")) {
        cellVal = norm.timestamp || nowStr;
      } else if (lowerCol.includes("nama") && (lowerCol.includes("lengkap") || lowerCol === "nama")) {
        cellVal = norm.fullName || "";
      } else if (lowerCol.includes("nik")) {
        cellVal = norm.nik || "";
      } else if (lowerCol.includes("kota") || lowerCol.includes("penempatan")) {
        cellVal = norm.placementCity || "";
      } else if (lowerCol.includes("asm")) {
        cellVal = norm.asmName || "";
      } else if (lowerCol.includes("vendor")) {
        cellVal = norm.vendorName || "";
      } else if (lowerCol.includes("wa") || lowerCol.includes("whatsapp") || lowerCol.includes("hp") || lowerCol.includes("telepon")) {
        cellVal = norm.phoneNumber || "";
      } else if (lowerCol.includes("email")) {
        cellVal = norm.email || "";
      } else if (lowerCol.includes("training") && (lowerCol.includes("tanggal") || lowerCol.includes("tgl") || lowerCol.includes("jadwal"))) {
        cellVal = norm.trainingDate || "";
      } else if (lowerCol.includes("ktp") || lowerCol.includes("kk") || lowerCol.includes("foto") || lowerCol.includes("ijazah")) {
        // Kolom dokumen URL: ambil langsung dari rawData tanpa mengubah format link URL
        if (item.rawData && item.rawData[colName] !== undefined) {
          cellVal = item.rawData[colName];
        }
      } else {
        // Cek kecocokan langsung dari rawData asli formulir (preserves unmapped columns)
        if (item.rawData && item.rawData[colName] !== undefined) {
          cellVal = item.rawData[colName];
        } else if (item.unmappedExtraColumns && item.unmappedExtraColumns[colName] !== undefined) {
          cellVal = item.unmappedExtraColumns[colName];
        }
      }

      rowData.push(cellVal);
    }

    insertedRows.push(rowData);

    // Siapkan baris pencatatan IMPORT_LOG
    logRows.push([
      rId,
      nowStr,
      fileName,
      norm.fullName || "",
      norm.nik || "",
      norm.trainingDate || "",
      "success",
      ""
    ]);

    // Tandai agar tidak ganda di dalam batch yang sama
    if (rId) importedIds[rId] = true;
    insertedCount++;
  }

  // Tulis ke spreadsheet utama secara batch (efisien dan aman)
  if (insertedRows.length > 0) {
    var startRow = targetSheet.getLastRow() + 1;
    targetSheet.getRange(startRow, 1, insertedRows.length, targetHeaders.length).setValues(insertedRows);
  }

  // Tulis ke tab IMPORT_LOG
  if (logRows.length > 0) {
    var startLogRow = logSheet.getLastRow() + 1;
    logSheet.getRange(startLogRow, 1, logRows.length, 8).setValues(logRows);
  }

  return {
    success: true,
    message: "Berhasil mengimpor " + insertedCount + " data respons baru ke Google Sheets.",
    insertedCount: insertedCount,
    skippedCount: skippedCount,
    totalProcessed: records.length,
    timestamp: nowStr,
  };
}

/**
 * ==============================================================================
 * FUNGSI 4: getImportHistory()
 * Mengambil riwayat log import dari tab IMPORT_LOG
 * ==============================================================================
 */
function getImportHistory() {
  var ss = getSpreadsheet_();
  var logSheet = getOrCreateLogSheet_(ss);
  var lastRow = logSheet.getLastRow();

  var logs = [];
  if (lastRow > 1) {
    // Ambil maksimal 50 log terakhir
    var rowCount = Math.min(lastRow - 1, 50);
    var startRow = Math.max(2, lastRow - rowCount + 1);
    var data = logSheet.getRange(startRow, 1, rowCount, 8).getValues();

    for (var i = data.length - 1; i >= 0; i--) {
      logs.push({
        responseId: String(data[i][0]),
        importTime: String(data[i][1]),
        fileName: String(data[i][2]),
        fullName: String(data[i][3]),
        nik: String(data[i][4]),
        trainingDate: String(data[i][5]),
        status: String(data[i][6]),
        error: String(data[i][7]),
      });
    }
  }

  return {
    success: true,
    logs: logs,
    total: logs.length,
  };
}

/**
 * Helper JSON Response dengan CORS Header terbuka
 */
function createJsonResponse_(data, statusCode) {
  var jsonString = JSON.stringify(data);
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

