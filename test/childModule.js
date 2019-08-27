const globalVar = require('./main')

const moduleFunction = function(){
    return `globalVar: ${globalVar}`
};

module.exports = moduleFunction;