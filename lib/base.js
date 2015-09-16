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

var argv = require('./argv');

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