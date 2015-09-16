var _ = require('lodash');
var sub = require('string-sub');

var base = require('../base');

var STR_SUB_HAS_CHANGED = base.STR_SUB_HAS_CHANGED;

var REGEX = require('../regex');

var getRegExp = REGEX.getRegExp;

var css = {};

var getClassReplacer = function(item) {
	return function(result, rule, context) {
		var rawContent = context.rawContent;

		rawContent = rawContent.replace(rule.regex, '$1.' + item);

		return rawContent;
	};
};

_.forEach(
	REGEX.MAP_CLASS_NAMES_CONVERT_CSS,
	function(item, index) {
		css[index] = {
			message: function(result, rule, context) {
				var match = result[0];

				return sub(STR_SUB_HAS_CHANGED, match.replace(/.*\.(.*)/, '$1'), item);
			},
			regex: getRegExp('(^|\\s)\\.' + index, 'g'),
			replacer: getClassReplacer(item),
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
					STR_SUB_HAS_CHANGED,
					match.replace(/(^|\s)\.(.*)/, '$2'),
					match.replace(rule.regex, item)
				);
			},
			regex: getRegExp('(^|\\s)\\.' + index, 'g'),
			replacer: getClassReplacer(item),
			test: 'match'
		};
	}
);

module.exports = css;