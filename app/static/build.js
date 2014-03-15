var less = require('less');

var parser = new(less.Parser)({
	paths: ['.', './lib'],
	filename: 'style.less'
})