var _ = require('lodash');
var sub = require('string-sub');

var base = require('../base');

var STR_SUB_HAS_CHANGED = base.STR_SUB_HAS_CHANGED;

var REGEX = require('../regex');

var btnRegex = REGEX.REGEX_BTN_CLASS;
var getRegExp = REGEX.getRegExp;

var js = {};

_.forEach(
	REGEX.MAP_CLASS_NAMES_CONVERT_JS,
	function(item, index) {
		js[index] = {
			message: function(result, rule, context) {
				return sub(STR_SUB_HAS_CHANGED, result[0], item);
			},
			regex: getRegExp('\\b(-)?(' + index + ')\\b', 'g'),
			replacer: function(result, rule, context) {
				var rawContent = context.rawContent;

				rawContent = rawContent.replace(rule.regex, rule._formatReplacement());

				return rawContent;
			},
			test: function(content, regex, rule) {
				var match = content.match(regex);

				if (match && !_.startsWith(match[0], '-') && !btnRegex.test(content)) {
					return match;
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
		};
	}
);

module.exports = js;