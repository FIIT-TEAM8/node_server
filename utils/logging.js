const { format } = require("date-fns");

function getCurrentDateTimeString() {
  return format(new Date(), "yyyy-dd-MM HH:mm:ss");
}

function debug(output) {
  const DEBUG = process.env.NODE_ENV !== "production";
  const time = getCurrentDateTimeString();
  if (DEBUG) {
    console.log(`${time} DEBUG: ${output}`);
  }
}
function errLog(output) {
  const time = getCurrentDateTimeString();
  console.error(`${time} ERROR: ${output} :ERROR END`);
}

function getErrorInfoString(error) {
  if (error.message || error.name) {
    return `ERROR OCCURRED\n\tname: ${error.name} message: ${error.message} at: ${error.at}`;
  }
  return "UNKNOWN ERROR OCCURRED";
}

function infoLog(output) {
  const time = getCurrentDateTimeString();
  console.log(`${time} INFO: ${output}`);
}

module.exports = {
  getErrorInfoString,
  infoLog,
  errLog,
  debug,
};
