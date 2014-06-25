var base = require('./base');
var re = require('./regex');

var A = base.A;
var iterateLines = base.iterateLines;
var log = base.log;

var getRegExp = re.getRegExp;
var getDiff = base.getDiff;

var SHOW_DIFF = base.SHOW_DIFF;
var PREFIX_LINE_NUM = base.PREFIX_LINE_NUM;

var STR_HAS_CHANGED = base.STR_HAS_CHANGED;

module.exports = function(content) {
	var classNameConvertMap = re.MAP_CLASS_NAMES_CONVERT_JS;

	var regex = getRegExp('\\b(-)?(' + Object.keys(classNameConvertMap).join('|') + ')\\b', 'g');

	var btnRegex = getRegExp('\\bbtn-(default|primary|danger|info|warning|success|link)\\b');

	content = iterateLines(
		content,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			var lineNum = index + 1;

			var newLine = fullItem;

			newLine = newLine.replace(
				regex,
				function(str, dash, cssClass) {
					if (!dash) {
						if (cssClass in classNameConvertMap && !btnRegex.test(newLine)) {
							str = classNameConvertMap[cssClass];

							log.line(lineNum, STR_HAS_CHANGED, cssClass, str);
						}
					}

					return str;
				}
			);

			if (newLine != fullItem) {
				var newLineRep = newLine;

				if (SHOW_DIFF) {
					newLineRep = getDiff(fullItem, newLine);

					log(('diff:'.help) + ' %s', newLineRep);
				}
			}

			return newLine;
		}
	);

	return content;
};