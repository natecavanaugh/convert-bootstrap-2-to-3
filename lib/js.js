var base = require('./base');
var re = require('./regex');

var iterateLines = base.iterateLines;
var log = base.log;

var getRegExp = re.getRegExp;
var getDiff = base.getDiff;
var getLineOffset = base.getLineOffset;

var SHOW_DIFF = base.SHOW_DIFF;
var PREFIX_LINE_NUM = base.PREFIX_LINE_NUM;

var STR_HAS_CHANGED = base.STR_HAS_CHANGED;

module.exports = function(content, file, lineOffset) {
	var classNameConvertMap = re.MAP_CLASS_NAMES_CONVERT_JS;

	var regex = getRegExp('\\b(-)?(' + Object.keys(classNameConvertMap).join('|') + ')\\b', 'g');

	var btnRegex = getRegExp('\\bbtn-(default|primary|danger|info|warning|success|link)\\b');

	content = iterateLines(
		content,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			var lineNum = getLineOffset(lineOffset) + index + 1;

			var newLine = fullItem;

			newLine = newLine.replace(
				regex,
				function(str, dash, cssClass) {
					if (!dash) {
						if (classNameConvertMap.hasOwnProperty(cssClass) && !btnRegex.test(newLine)) {
							str = classNameConvertMap[cssClass];

							log.line(lineNum, STR_HAS_CHANGED, cssClass, str);
						}
					}

					return str;
				}
			);

			if (newLine != fullItem && SHOW_DIFF) {
				log.line(log.SUBTLE_LINE_NUM, lineNum, ('diff:'.help) + ' %s', getDiff(fullItem, newLine));
			}

			return newLine;
		}
	);

	return content;
};