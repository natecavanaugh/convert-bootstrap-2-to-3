var _ = require('lodash');
var sub = require('string-sub');

var base = require('../base');

var STR_SUB_HAS_CHANGED = base.STR_SUB_HAS_CHANGED;

var REGEX = require('../regex');

var classNameConvertMap = REGEX.MAP_CLASS_NAMES_CONVERT_HTML;
var getRegExp = REGEX.getRegExp;

var tmpRE = getRegExp(_.values(classNameConvertMap).join('|') + '|btn btn-.*');

var html = {
	varsConverted: {
		message: function(result, rule, context) {
			var message = '';

			context.rawContent.replace(
				rule.regex,
				function(m, $1, $2, $3, $4) {
					message = sub(STR_SUB_HAS_CHANGED, $3, classNameConvertMap[$3]);
				}
			);

			return message;
		},
		regex: getRegExp('(position=)?(["\'\\s])(' + Object.keys(classNameConvertMap).join('|') + ')(["\'\\s])', 'g'),
		replacer: function(result, rule, context) {
			return context.rawContent.replace(
				rule.regex,
				function(m, $1, $2, $3, $4) {
					if ($1) {
						return m;
					}

					return $2 + (classNameConvertMap[$3] || $3) + $4;
				}
			);
		},
		test: function(content, regex, rule, context) {
			return regex.test(content) && !tmpRE.test(content);
		}
	}
};

module.exports = html;