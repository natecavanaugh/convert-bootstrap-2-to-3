var _ = require('lodash');
var sub = require('string-sub');

var REGEX = require('../regex_new');

var getRegExp = REGEX.getRegExp;

var classNameConvertMap = REGEX.MAP_CLASS_NAMES_CONVERT_HTML;

var tmpRE = getRegExp(_.values(classNameConvertMap).join('|') + '|btn btn-.*');

var html = {
	varsConverted: {
		message: '"{0}" has changed to "{1}"',
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