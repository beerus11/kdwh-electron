const INVALID_CSV_FILE = { code: 10001, message: 'Invalid CSV File' };
const HEADERS_EXTRA_COLUMN_FOUND = { code: 10002, message: 'Extra columns found in CSV: {}' };
const HEADERS_COLUMN_MISSING = { code: 10003, message: 'Column missing in CSV: {}' };
const CELL_INCORRECT_DATA_TYPE = { code: 10004, message: '{} row for {} has incorrect data type, required {}. but found {}' };

module.exports = {
    INVALID_CSV_FILE,
    HEADERS_EXTRA_COLUMN_FOUND,
    HEADERS_COLUMN_MISSING,
    CELL_INCORRECT_DATA_TYPE,
  };
  
