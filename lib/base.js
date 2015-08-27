var _ = require('lodash');
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
			default: true
		},
		i: {
			alias: 'inline-edit',
			boolean: true,
			default: false
		},
		d: {
			alias: 'diff',
			boolean: true,
			default: false
		},
		q: {
			alias: 'quiet',
			boolean: true,
			default: false
		},
		o: {
			alias: 'open',
			boolean: true,
			default: false
		},
		removeold: {
			boolean: true,
			default: false
		}
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
exports.QUIET = argv.q;

exports.REMOVE_OLD_VARS = argv.removeold;
exports.INLINE_REPLACE = argv.i;
exports.SHOW_DIFF = argv.d;
exports.OPEN_FILES = argv.o;

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

String.prototype.toDash = function() {
	return this.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
};

String.prototype.toCamel = function() {
	return this.toLowerCase().replace(
		/-(.)/g,
		function(m, $1) {
			return $1.toUpperCase();
		}
	);
};

exports.prefix = function(str, prefix) {
	str = String(str);
	if (str.indexOf(prefix) !== 0) {
		str = prefix + str;
	}

	return str;
};

exports._ = _;

var prefixLineNum = 'Line %s: ';
var prefixLineNums = 'Lines %s: ';
exports.PREFIX_LINE_NUM = prefixLineNum.warn;
exports.PREFIX_LINE_NUM_SUBTLE = prefixLineNum.subtle;

exports.STR_HAS_CHANGED = '"%s" has changed to "%s"';
exports.STR_SUB_HAS_CHANGED = '"{0}" has changed to "{1}"';

exports.iterateLines = function(contents, iterator) {
	var lines = contents.split('\n');

	return lines.map(iterator).join('\n');
};

exports.getLineOffset = function(num) {
	return _.isNumber(num) ? num : (parseInt(num, 10) || 0);
};

exports.toInt = function(num) {
	return parseInt(num, 10) || 0;
};

var INDENT = '    ';

var getLineNumber = _.memoize(
	function(line) {
		var m = line.match(/Lines? ([0-9]+):/);

		return parseInt(m && m[1], 10) || 0;
	}
);

var sortLog = function(a, b) {
	var aNum = getLineNumber(a);
	var bNum = getLineNumber(b);

	return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
};

var _logBuffer = [];

var log = function() {
	var str = util.format.apply(util, arguments);

	_logBuffer.push(str);
};

log.flush = function(indent) {
	var prefix = indent ? log.INDENT : '';

	_logBuffer.sort(sortLog);

	var str = prefix + _logBuffer.join('\n' + prefix);

	console.log(str);

	_logBuffer.length = 0;
};

log.size = function() {
	return _logBuffer.length;
};

log.INDENT = INDENT;

log.INDENT_LINE = {};
log.SUBTLE_LINE_NUM = {};

log.line = function() {
	var args = [];
	args.push.apply(args, arguments);
	var firstArg = '';

	var prefixLine = exports.PREFIX_LINE_NUM;

	if (args[0] === log.SUBTLE_LINE_NUM) {
		prefixLine = exports.PREFIX_LINE_NUM_SUBTLE;
		args.shift();
	}

	if (args[0] === log.INDENT_LINE) {
		prefixLine = log.INDENT + prefixLine;
		args.shift();
	}

	if (_.isNumber(args[0])) {
		firstArg = util.format(prefixLine, args.shift());
	}

	log(firstArg, util.format.apply(util, args));
};

exports.log = log;