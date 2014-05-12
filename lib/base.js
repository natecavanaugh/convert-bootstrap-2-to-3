var YUI = require('yui').YUI;
var A = YUI().use('yui-base', 'oop', 'array-extras');

var colors = require('colors');
var diff = require('diff');
var util = require('util');

colors.setTheme({
	help: 'cyan',
	warn: 'yellow',
	error: 'red',
	added: 'green',
	removed: 'red',
	subtle: 'grey'
});

var argv = require('optimist').usage('Usage: $0 -qo').options(
	{
		v: {
			alias: 'variables',
			boolean: true,
			default: false
		},
		c: {
			alias: 'css',
			boolean: true,
			default: false
		},
		i: {
			alias: 'inline-edit',
			boolean: true,
			default: false
		},
		h: {
			alias: 'html',
			boolean: true,
			default: false
		},
		j: {
			alias: 'js',
			boolean: true,
			default: false
		},
		f: {
			alias: 'files',
			boolean: true,
			default: true
		},
		d: {
			alias: 'diff',
			boolean: true,
			default: false
		},
		checkvars: {
			boolean: true,
			default: false
		},
		removeold: {
			boolean: true,
			default: false
		},
		verbose: {
			boolean: true,
			default: false
		},
		// stdin: {
		// 	boolean: true,
		// 	default: false
		// }
	}
).argv;

			// .boolean('v')
			// .boolean('checkvars')
			// .boolean('removeold')
			// .boolean('verbose')
			// .boolean('c')
			// .boolean('i')
			// .boolean('h')
			// .default('f', true).argv;
// console.log(argv, cli.parse({
// 	v: ['variables', 'Look for variables to upgrade', 'boolean'],
// 	c: ['css', 'Look for class names to upgrade in a CSS file', 'boolean'],
// 	h: ['html', 'Look for class names to upgrade in an HTML(-like) file', 'boolean'],
// 	f: ['files', 'Treat the arguments as a list of files', 'boolean'],
// 	i: ['inline-edit', 'Edit the files inline', 'boolean'],
// 	q: ['quiet', 'Don\'t output a file entry if no changes were found', 'boolean'],
// 	verbose: [false, 'Get chatty', 'boolean'],
// 	removeold: [false, 'Remove old variables from Bootstrap 2 (use with -v)', 'boolean'],
// 	checkvars: [false, 'Check that the variables are defined in Bootstrap 3 (use with -v)', 'boolean'],
// }));

exports.argv = argv;

exports.args = argv._;

exports.VARS = argv.v;
exports.CSS_CLASS_NAMES = argv.c;
exports.HTML_CLASS_NAMES = argv.h;
exports.JS_CLASS_NAMES = argv.j;
exports.FILES = argv.f;
exports.CHECK_VARS = argv.checkvars;
exports.REMOVE_OLD_VARS = argv.removeold;
exports.VERBOSE = argv.verbose;
exports.INLINE_REPLACE = argv.i;
exports.SHOW_DIFF = argv.d;

exports.getDiff = function(before, after) {
	var cmp = diff.diffWords(before.trim(), after.trim());

	return cmp.map(
		function(item, index, collection) {
			var val = item.value;

			var color = '';

			if (item.added) {
				color = 'added';
			}
			else if (item.removed) {
				color = 'removed';
			}

			if (color) {
				val = val[color];
			}

			return val;
		}
	).join('');
};

Array.prototype.diff = function(a) {
	return this.filter(function(i) {return a.indexOf(i) < 0;});
};

String.prototype.toDash = function(){
	return this.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
};

exports.A = A;
exports.YUI = YUI;

exports.PREFIX_LINE_NUM = 'Line %s: '.warn;

exports.iterateLines = function(contents, iterator) {
	var lines = contents.split('\n');

	return lines.map(iterator).join('\n');
};

var INDENT = '    ';

var _logBuffer = [];

var log = function() {
	var str = util.format.apply(util, arguments);

	_logBuffer.push(str);
};

log.flush = function(indent) {
	var prefix = indent ? log.INDENT : '';

	var str = prefix + _logBuffer.join('\n' + prefix);

	console.log(str);

	_logBuffer.length = 0;
};

log.INDENT = INDENT;

exports.log = log;