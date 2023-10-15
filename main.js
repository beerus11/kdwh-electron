const { app, BrowserWindow, dialog,ipcMain } = require('electron');
const { INVALID_CSV_FILE, HEADERS_EXTRA_COLUMN_FOUND, HEADERS_COLUMN_MISSING, CELL_INCORRECT_DATA_TYPE } = require('./errors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const readline = require('readline');
const axios = require('axios');
const {GlassDoorValidator} = require('./validator')

let mainWindow;

app.on('ready', createWindow);


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // Disable Node.js integration in the renderer process
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // Specify the preload script
    }
  });

  mainWindow.loadFile('index.html');
  //mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
}

function openCSVFile(dataSource) {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
  }).then((result) => {
    if (!result.canceled) {
      const filePath = result.filePaths[0];
      validateCSV(filePath,dataSource);
    }
  });
}

function validateCSV(filePath,dataSource) {
  const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const errorStream = fs.createWriteStream('error_report.csv');
  errorStream.write('Error Message\n');
  const lineReader = readline.createInterface({
    input: readStream,
    output: process.stdout,
    terminal: false
  });

  const validator = new GlassDoorValidator(dataSource);

  let lineCount = 1;
  let errCount = 0;
  let headerRow = [];

  lineReader.on('line', (line) => {
    //currentChunk += line + '\n';
    if(lineCount==1){
      headerRow = parseCSVLine(line,"|");
     console.log(validator.validateHeaders(headerRow));

    }

    if (lineCount>1){
      const row = parseCSVLine(line,"|");
      const error = validator.validateRow(headerRow,row,lineCount);
      if(error.length>0){
        const errorLine = `"${error.join(",")}"\n`;
        errorStream.write(errorLine);
        errCount+=1
      }
    }
    

    mainWindow.webContents.send('update-counter',lineCount);
    lineCount++;
  });

  lineReader.on('close', () => {
    errorStream.end();
    mainWindow.webContents.send('validation-complete', {isValid : errCount==0,errfileName:'error_report.csv',rawFile:filePath});
    // Process the remaining data in the last chunk
    // if (currentChunk) {
    //   processChunk(currentChunk);
    // }
  });

  function processChunk(chunk) {
    chunk = chunk.trim(); // Remove trailing newline
    const lines = chunk.split('\n');

    for (const line of lines) {
      // Your validation logic here
      const isValid = validateRow(line);
      if (!isValid|| true) {
        console.log(`Invalid CSV data in line ${lineCount + 1}:`, line.split("|")[0]);
        // Handle the invalid data (e.g., display an error message)
      }
      mainWindow.webContents.send('update-counter',lineCount);
      console.log(lineCount);
      lineCount++;
    }
  }

  function validateRow(line,dataSource,row,isHeader) {
    // Implement your validation logic for a single row here
    // Return true if the row is valid, false if it's invalid

    // Example validation: Check if a specific field is present in the row
    if(isHeader){
      console.log(validator.validateHeaders());
    }
    
    return line.includes('yourFieldName');
  }
}



// Add an event listener for the "Open CSV" button in your HTML file
// Call the openCSVFile function to open a CSV file

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


// Event listener to handle communication from the renderer process
ipcMain.on('open-csv-file', (event,dataSource) => {
  openCSVFile(dataSource.dataSource);
});

ipcMain.on('save-dialog', (event, defaultPath) => {
  dialog.showSaveDialog(mainWindow, {
    defaultPath,
    buttonLabel: 'Save Error Report',
  }).then((result) => {
    if (!result.canceled) {
      const fs = require('fs');
      fs.rename(defaultPath, result.filePath, (err) => {
        if (err) {
          console.error('Error moving the file:', err);
        } else {
          console.log('File saved in:', result.filePath);
        }
      });
    }
  });
});


ipcMain.on('download', (event,{payload}) => {
  //console.log(payload);
  mainWindow.webContents.downloadURL(payload.fileUrl);
});

ipcMain.on('upload-csv',(event,{payload}) =>{

  //console.log(payload)
  // Read the CSV file
  const file = fs.createReadStream(payload.filePath);
  const contentLength = fs.statSync(payload.filePath).size;

  axios({
    method: 'put',
    url: payload.response.url,
    data: file,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Length': contentLength,
    },
  })
    .then((response) => {
      console.log('File successfully uploaded to S3');
      const event = {
        uploadId: payload.response.uploadId,
        path: payload.response.path
      }
      mainWindow.webContents.send('upload-complete',event);
    })
    .catch((error) => {
      console.error('Error uploading file to S3', error);
    });
});

function parseCSVLine(line, delimiter) {
  const values = [];
  let currentValue = '';
  let insideQuotedValue = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === delimiter && !insideQuotedValue) {
      values.push(currentValue);
      currentValue = '';
    } else if (char === '"') {
      if (insideQuotedValue) {
        insideQuotedValue = false;
      } else {
        insideQuotedValue = true;
      }
    } else {
      currentValue += char;
    }
  }

  values.push(currentValue);

  return values;
}

