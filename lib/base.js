var _ = require('lodash');
var colors = require('cli-color-keywords')();
var diff = require('diff');
var toInt = require('to-int');

exports.getDiff = function(before, after) {
	var cmp = diff.diffWords(before.trim(), after.trim());

	return cmp.map(
		function(item, index, collection) {
			var val = item.value;

			var color = '';

			if (item.added) {
				color = 'green';
			}
			else if (item.removed) {
				color = 'error';
			}

			if (color) {
				val = colors[color](val);
			}

			return val;
		}
	).join('');
};

exports.prefix = function(str, prefix) {
	str = String(str);
	if (str.indexOf(prefix) !== 0) {
		str = prefix + str;
	}

	return str;
};

exports._ = _;

exports.STR_SUB_HAS_CHANGED = '"{0}" has changed to "{1}"';

exports.iterateLines = function(contents, iterator) {
	var lines = contents.split('\n');

	return lines.map(iterator).join('\n');
};

exports.getLineOffset = function(num) {
	return _.isNumber(num) ? num : toInt;
};