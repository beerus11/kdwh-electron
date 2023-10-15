
const { INVALID_CSV_FILE, HEADERS_EXTRA_COLUMN_FOUND, HEADERS_COLUMN_MISSING, CELL_INCORRECT_DATA_TYPE } = require('./errors');
const fs = require('fs');

function checkType(value) {
  // Check if the string is a float
  if (!isNaN(parseFloat(value)) && isFinite(value)) {
    return "float";
  }

  // Check if the string is an integer
  if (!isNaN(parseInt(value)) && isFinite(value)) {
    return "int";
  }

  // If none of the above conditions are met, it's a string
  return "string";
}


class GlassDoorValidator {
  
  constructor(dataSource) {
    this.validationRules = null;
    this.validationJSON = '/.validators/glassdoor.json';
    this.columns = null;
    this.headerDataTypes = null;
    this.dataSource = dataSource;
    this.loadValidationFile();
    //this.validate(filename);
  }

  validateHeaders(headers) {
    const errors = [];
    const columns = headers;
    const requiredCols = new Set([...this.columns]);
    const csvCols = new Set(columns);

    if (JSON.stringify([...requiredCols]) === JSON.stringify([...csvCols])) {
      return errors;
    }

    if (csvCols.size > requiredCols.size) {
      const msg = [...csvCols].filter((col) => !requiredCols.has(col)).join(',');
      console.log(HEADERS_EXTRA_COLUMN_FOUND);
      errors.push([HEADERS_EXTRA_COLUMN_FOUND['message'].replace('{}', msg)]);
    }

    if (requiredCols.size > csvCols.size) {
      const msg = [...requiredCols].filter((col) => !csvCols.has(col)).join(',');
      console.log(HEADERS_COLUMN_MISSING);
      errors.push([HEADERS_COLUMN_MISSING['message'].replace('{}', msg)]);
    }

    return errors;
  }

  loadValidationFile() {
    const validationFile = fs.readFileSync(`${process.cwd()}${this.validationJSON}`);
    this.validationRules = JSON.parse(validationFile);
    this.columns = new Set(this.validationRules.columns.map((item) => item.name));
    this.headerDataTypes = this.validationRules.columns.reduce((acc, item) => {
      acc[item.name] = item.type;
      return acc;
    }, {});
    //console.log(this.headerDataTypes);
  }

  validateRow(headerRow,row,rowCounter) {
    const errors = [];
    for (let j = 0; j < row.length; j++) {
      const colName = headerRow[j];
      const requiredType = this.headerDataTypes[colName];
      const currentType = checkType(row[j]);
    
      if (requiredType !== currentType) {
        errors.push(
          CELL_INCORRECT_DATA_TYPE['message']
            .replace('{}', rowCounter)
            .replace('{}', colName)
            .replace('{}', requiredType)
            .replace('{}', currentType),
        );
      }
    }
    return errors;
  }
}

module.exports = {
  GlassDoorValidator,
}
