var _ = require('lodash');
var sub = require('string-sub');

var REGEX = require('../regex');

var getRegExp = REGEX.getRegExp;

var btnRegex = REGEX.REGEX_BTN_CLASS;

var js = {};

_.forEach(
	REGEX.MAP_CLASS_NAMES_CONVERT_JS,
	function(item, index) {
		js[index] = {
			message: function(result, rule, context) {
				return sub('"{0}" has changed to "{1}"', result[0], item);
			},
			regex: getRegExp('\\b(-)?(' + index + ')\\b', 'g'),
			replacer: function(result, rule, context) {
				var rawContent = context.rawContent;

				rawContent = rawContent.replace(rule.regex, rule._formatReplacement());

				return rawContent;
			},
			test: function(content, regex, rule) {
				if (!btnRegex.test(content)) {
					return content.match(regex);
				}
			},
			_formatReplacement: function() {
				var formattedReplacement = item;

				var items = formattedReplacement.split(' ');

				if (items.length > 1) {
					formattedReplacement = _.map(
						items,
						function(className, index) {
							if (index > 0) {
								className = '.' + className;
							}

							return className;
						}
					).join(' ');
				}

				return formattedReplacement;
			}
		}
	}
);

module.exports = js;