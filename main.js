const { app, BrowserWindow, dialog,ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const readline = require('readline');

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
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
}

function openCSVFile() {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
  }).then((result) => {
    if (!result.canceled) {
      const filePath = result.filePaths[0];
      validateCSV(filePath);
    }
  });
}

function validateCSV(filePath) {
  const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const lineReader = readline.createInterface({
    input: readStream,
    output: process.stdout,
    terminal: false
  });

  let currentChunk = '';
  let lineCount = 1;

  lineReader.on('line', (line) => {
    //currentChunk += line + '\n';
    console.log(line,"\n\n");
    console.log(mainWindow.webContents.send);
    mainWindow.webContents.send('update-counter',lineCount);
    lineCount++;
    // if (currentChunk.length >= 1024 * 1024) { // Process each megabyte of data
    //   processChunk(currentChunk);
    //   currentChunk = '';
    // }
  });

  lineReader.on('close', () => {
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

  function validateRow(line) {
    // Implement your validation logic for a single row here
    // Return true if the row is valid, false if it's invalid

    // Example validation: Check if a specific field is present in the row
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
ipcMain.on('open-csv-file', () => {
  console.log("csv")
  openCSVFile();
});