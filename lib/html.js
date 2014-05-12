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

	//var REGEX_VARS_CONVERTED_RE = getRegExp('' + Object.keys(re.MAP_REGEX_CLASS_NAMES_CONVERT_HTML).join('|') + '', 'g');

	content = iterateLines(
		content,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			var lineNum = index + 1;

			//var attrs = fullItem.match(/(?: )([A-Za-z0-9-]+=["'][^"']+["'])/g);

			var newLine = fullItem.replace(/\b(([A-Za-z0-9-]+)=(["'])([^"']+)\3)/g, function(m, attr, attrName, quote, attrValue) {
				var full = attrName + '=' + quote + attrValue + quote;
				//full != m && console.log(false);
				if ((/(?!class(Name|PK))(css)?Class/i).test(attrName)) {
				//if (attrName == 'class' || attrName == 'cssClass') {
					var attrValuePieces = attrValue.split(' ');

					var attrValuePiecesFiltered = attrValuePieces.map(
						function(item2, index2) {
							var newItem = item2;

							if (newItem in classNameConvertMap) {
								//if (newItem == 'btn') {
								//	console.log(newItem, /\bbtn-.*\b/.test(attrValue));
								//}
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
					//attrValue.match(/\b(input-group|btn-default)\b/g) && console.log(attrValue);
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

					//if (classNameConvertMap[$3]) {
					//	log($3, classNameConvertMap[$3], newLine);
					//}
					return $2 + (classNameConvertMap[$3] || $3) + $4;
				});

				//console.log(newLine);
			}

			if (newLine != fullItem) {
				var newLineRep = newLine;

				if (SHOW_DIFF) {
					newLineRep = getDiff(fullItem, newLine);
				}

				log(PREFIX_LINE_NUM, lineNum, newLineRep);
			}

			//if (attrs) {
			//	var lastAttr = -1;

			//	attrs.forEach(
			//		function(item, index, collection) {
			//			var pieces = item.trim().split('=');

			//			var attrName = pieces[0];
			//			var attrValue = pieces[1].trim().replace(/(^["']|["']$)/g, '');

			//			var attrValuePieces = attrValue.split(' ');

			//			var lastAttrPiece = -1;

			//			if (/class|cssClass/.test(attrName)) {
			//				attrValuePieces.forEach(
			//					function(item2, index2) {
			//						if (item2 in re.MAP_CLASS_NAMES_CONVERT) {
			//							console.log('----', item2.warn);
			//						}
			//					}
			//				);
			//			}

			//			lastAttr = attrName;
			//		}
			//	);
			//}

			return newLine;
		}
	);

	return content;
};