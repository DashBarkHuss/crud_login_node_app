const closure = function(){return function(){return [arguments, globalVar]}};

module.exports = closure;