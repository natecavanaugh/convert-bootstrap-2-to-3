var _ = require('lodash');
var sub = require('string-sub');

var REGEX = require('../regex_new');

var getRegExp = REGEX.getRegExp;

var css = {};

_.forEach(
	REGEX.MAP_CLASS_NAMES_CONVERT_CSS,
	function(item, index) {
		css[index] = {
			message: function(result, rule, context) {
				var match = result[0];

				return sub('"{0}" has changed to "{1}"', match.replace(/.*\.(.*)/, '$1'), item);
			},
			regex: getRegExp('(^|\\s)\\.' + index, 'g'),
			replacer: function(result, rule, context) {
				var rawContent = context.rawContent;

				rawContent = rawContent.replace(rule.regex, '$1.' + item);

				return rawContent;
			},
			test: 'match'
		};
	}
);

_.forEach(
	REGEX.MAP_REGEX_CLASS_NAMES_CONVERT_CSS,
	function(item, index) {
		css[index] = {
			message: function(result, rule, context) {
				var match = result[0];

				return sub(
					'"{0}" has changed to "{1}"',
					match.replace(/(^|\s)\.(.*)/, '$2'),
					match.replace(rule.regex, item)
				);
			},
			regex: getRegExp('(^|\\s)\\.' + index, 'g'),
			replacer: function(result, rule, context) {
				var rawContent = context.rawContent;

				rawContent = rawContent.replace(rule.regex, '$1.' + item);

				return rawContent;
			},
			test: 'match'
		};
	}
);

module.exports = css;