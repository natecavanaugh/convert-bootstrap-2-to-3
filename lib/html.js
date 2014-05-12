var base = require('./base');
var re = require('./regex');

var A = base.A;
var iterateLines = base.iterateLines;
var log = base.log;

var getRegExp = re.getRegExp;
var getDiff = base.getDiff;

var SHOW_DIFF = base.SHOW_DIFF;
var PREFIX_LINE_NUM = base.PREFIX_LINE_NUM;

module.exports = function(content) {
	var classNameConvertMap = re.MAP_CLASS_NAMES_CONVERT_HTML;

	var REGEX_VARS_CONVERTED = getRegExp('(position=)?(["\'\\s])(' + Object.keys(classNameConvertMap).join('|') + ')(["\'\\s])', 'g');

	content = iterateLines(
		content,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			var lineNum = index + 1;

			var newLine = fullItem.replace(/\b(([A-Za-z0-9-]+)=(["'])([^"']+)\3)/g, function(m, attr, attrName, quote, attrValue) {
				var full = attrName + '=' + quote + attrValue + quote;
				if ((/(?!class(Name|PK))(css)?Class/i).test(attrName)) {
					var attrValuePieces = attrValue.split(' ');

					var attrValuePiecesFiltered = attrValuePieces.map(
						function(item2, index2) {
							var newItem = item2;

							if (newItem in classNameConvertMap) {
								if (newItem != 'btn' || (newItem == 'btn' && !/\bbtn-.*\b/.test(attrValue))) {
									newItem = classNameConvertMap[newItem];
								}
							}
							else {
								A.Object.each(
									re.MAP_REGEX_CLASS_NAMES_CONVERT_HTML,
									function(replace, rule) {
										newItem = newItem.replace(getRegExp(rule), replace);
									}
								);
							}

							return newItem;
						}
					);

					attrValue = attrValuePiecesFiltered.join(' ');
				}

				full = attrName + '=' + quote + attrValue + quote;

				return full;
			});

			var tmpRE = getRegExp(A.Object.values(classNameConvertMap).join('|') + '|btn btn-.*');

			if (REGEX_VARS_CONVERTED.test(newLine) && !tmpRE.test(newLine)) {
				newLine = newLine.replace(REGEX_VARS_CONVERTED, function(m, $1, $2, $3, $4) {
					if ($1) {
						return m;
					}

					return $2 + (classNameConvertMap[$3] || $3) + $4;
				});
			}

			if (newLine != fullItem) {
				var newLineRep = newLine;

				if (SHOW_DIFF) {
					newLineRep = getDiff(fullItem, newLine);
				}

				log(PREFIX_LINE_NUM, lineNum, newLineRep);
			}

			return newLine;
		}
	);

	return content;
};