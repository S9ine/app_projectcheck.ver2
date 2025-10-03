const SHEET_ID = '1UGms0ZFl0Iu-DaLp57CmvOc3oNQN0ODtq7JSXlZGjNY';

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function verifyLogin(username, password, role) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let usersSheet = ss.getSheetByName('Users');
    
    if (!usersSheet) {
      usersSheet = ss.insertSheet('Users');
      usersSheet.getRange('A1:C1').setValues([['Username', 'Password', 'Role']]);
      // Add default users
      usersSheet.getRange('A2:C3').setValues([
        ['admin', 'admin123', 'admin'],
        ['พนักงาน', 'emp123', 'employee']
      ]);
    }
    
    const users = usersSheet.getDataRange().getValues();
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === username && users[i][1] === password && users[i][2] === role) {
        return { success: true };
      }
    }
    
    return { success: false };
  } catch (error) {
    throw new Error('Login verification failed: ' + error.message);
  }
}

function getInitialData() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Get or create Zones sheet
    let zonesSheet = ss.getSheetByName('Zones');
    if (!zonesSheet) {
      zonesSheet = ss.insertSheet('Zones');
      zonesSheet.getRange('A1:B1').setValues([['ID', 'Name']]);
      zonesSheet.getRange('A2:B4').setValues([
        ['zone1', 'ลานจอดชั้น 1'],
        ['zone2', 'ประตูหน้า'],
        ['zone3', 'ประตูหลัง']
      ]);
    }
    
    // Get or create Records sheet
    let recordsSheet = ss.getSheetByName('Records');
    if (!recordsSheet) {
      recordsSheet = ss.insertSheet('Records');
      recordsSheet.getRange('A1:G1').setValues([
        ['ID', 'Zone', 'VehicleType', 'HasSticker', 'Notes', 'Timestamp', 'User']
      ]);
    }
    
    // Get zones data
    const zonesData = zonesSheet.getDataRange().getValues();
    const zones = [];
    for (let i = 1; i < zonesData.length; i++) {
      zones.push({
        id: zonesData[i][0],
        name: zonesData[i][1]
      });
    }
    
    // Get records data
    const recordsData = recordsSheet.getDataRange().getValues();
    const records = [];
    for (let i = 1; i < recordsData.length; i++) {
      records.push({
        id: recordsData[i][0],
        zone: recordsData[i][1],
        vehicleType: recordsData[i][2],
        hasSticker: recordsData[i][3],
        notes: recordsData[i][4],
        timestamp: recordsData[i][5],
        user: recordsData[i][6]
      });
    }
    
    return { zones, records };
  } catch (error) {
    throw new Error('Failed to load initial data: ' + error.message);
  }
}

function saveVehicleRecord(record) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const recordsSheet = ss.getSheetByName('Records');
    
    const id = 'R' + Date.now();
    const newRecord = [
      id,
      record.zone,
      record.vehicleType,
      record.hasSticker,
      record.notes,
      record.timestamp,
      record.user
    ];
    
    recordsSheet.appendRow(newRecord);
    
    return {
      success: true,
      record: {
        id: id,
        ...record
      }
    };
  } catch (error) {
    throw new Error('Failed to save record: ' + error.message);
  }
}

function addNewZone(zoneName) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const zonesSheet = ss.getSheetByName('Zones');
    
    const id = 'zone' + Date.now();
    zonesSheet.appendRow([id, zoneName]);
    
    return {
      success: true,
      zone: { id, name: zoneName }
    };
  } catch (error) {
    throw new Error('Failed to add zone: ' + error.message);
  }
}

function deleteZone(zoneId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const zonesSheet = ss.getSheetByName('Zones');
    
    const data = zonesSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === zoneId) {
        zonesSheet.deleteRow(i + 1);
        break;
      }
    }
    
    return { success: true };
  } catch (error) {
    throw new Error('Failed to delete zone: ' + error.message);
  }
}

function getRecordsByDate(date) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const recordsSheet = ss.getSheetByName('Records');
    
    const data = recordsSheet.getDataRange().getValues();
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const recordDate = new Date(data[i][5]).toDateString();
      const filterDate = new Date(date).toDateString();
      
      if (recordDate === filterDate) {
        records.push({
          id: data[i][0],
          zone: data[i][1],
          vehicleType: data[i][2],
          hasSticker: data[i][3],
          notes: data[i][4],
          timestamp: data[i][5],
          user: data[i][6]
        });
      }
    }
    
    return records;
  } catch (error) {
    throw new Error('Failed to get records: ' + error.message);
  }
}

function exportDataToFile(format) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const recordsSheet = ss.getSheetByName('Records');
    
    // Create a copy for export
    const exportSheet = ss.insertSheet('Export_' + Date.now());
    recordsSheet.getDataRange().copyTo(exportSheet.getRange('A1'));
    
    const url = ss.getUrl();
    const filename = `vehicle_records_${new Date().toISOString().split('T')[0]}.${format}`;
    
    return {
      success: true,
      url: url,
      filename: filename
    };
  } catch (error) {
    throw new Error('Failed to export data: ' + error.message);
  }
}
