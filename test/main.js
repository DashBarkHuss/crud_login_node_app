var globalVar = "global variable";
const moduleFunction = require('./childModule');
module.exports = globalVar;

console.log(moduleFunction())