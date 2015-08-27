var re = require('./regex');
var base = require('./base');

var _ = base._;
var iterateLines = base.iterateLines;
var log = base.log;
var getDiff = base.getDiff;
var getLineOffset = base.getLineOffset;
var toInt = base.toInt;

var getRegExp = re.getRegExp;

var PREFIX_LINE_NUM = base.PREFIX_LINE_NUM;
var SHOW_DIFF = base.SHOW_DIFF;

function getLineNum(str, index) {
	if (index) {
		str = str.substring(0, index);
	}

	return str.split('\n').length;
}

function escapeRegEx(str) {
	return str.replace(/([.*+?^$(){}|[\]\/\\])/g, '\\$1');
}

function extractRecursive(str, open, close, includeDetails) {
	if (open == close) {
		throw new Error('open and close arguments cannot be the same');
	}

	var openChar = open.substring(0, 1);
	var closeChar = close.substring(0, 1);
	var re = new RegExp(escapeRegEx(open) + '((?=([^' + escapeRegEx(openChar + closeChar) + ']+))\\2)*?' + escapeRegEx(close));

	var results = [];

	includeDetails = !!includeDetails;

	while (match = re.exec(str)) {
		var result = match[1] || '';
		var replace = '';

		if (includeDetails) {
			var index = match.index;
			var lineStart = getLineNum(str, index);
			var lineEnd = getLineNum(str, index + result.length);

			replace = result.replace(/[^\n]/g, '');

			result = {
				str: result,
				index: match.index,
				lineStart: lineStart,
				lineEnd: lineEnd
			};
		}

		id = results.push(result);

		str = str.replace(match[0], replace);
	}

	return results;
}

module.exports = function(content, file, lineOffset) {
	var classNameConvertMap = re.MAP_CLASS_NAMES_CONVERT_CSS;

	lines = content.split('\n');

	extractRecursive(content, '{', '}', true).forEach(
		function(item, index) {
			var str = item.str || item;
			var lineStart = item.lineStart;

			if (str.indexOf('content-box') > -1) {
				return;
			}

			var sizeMatch = str.match(/(?:^|\s)(height|width):\s?(.*?);/g);
			var paddingMatch = str.match(/padding(?:-(right|left|top|bottom))?:\s?(.*?);/);

			var notify = false;

			var height = 'auto';
			var width = 'auto';
			var newHeight = 0;
			var newWidth = 0;
			var newHeightFormatted = '';
			var newWidthFormatted = '';

			var heightLine = 0;
			var widthLine = 0;
			if (sizeMatch && paddingMatch) {

				sizeMatch.forEach(
					function(item, index) {
						var prop = item.replace(';', '').split(':');
						var val;
						if (prop.length > 1) {
							val = prop[1].trim();
						}

						if (val) {
							var itemLineNum = (getLineNum(str, str.indexOf(item)) - 1) + lineStart;

							if (item.indexOf('height') > -1) {
								height = val;
								heightLine = itemLineNum;
							}
							else {
								width = val;
								widthLine = itemLineNum;
							}
						}
					}
				);

				var paddingType = paddingMatch[1];
				var paddingValue = paddingMatch[2].trim();

				var padding = {
					t: '0',
					r: '0',
					b: '0',
					l: '0'
				};

				if (paddingType) {
					paddingType = paddingType.trim();

					padding[paddingType.substring(0, 1)] = paddingValue;
				}
				else {
					paddingType = 'padding';

					var paddingVals = paddingValue.split(' ');

					var paddingLength = paddingVals.length;

					var padVal = paddingVals[0];

					padding.t = padVal;
					padding.r = padVal;
					padding.b = padVal;
					padding.l = padVal;

					if (paddingLength > 1) {
						padding.r = paddingVals[1];
						padding.l = paddingVals[1];
					}

					if (paddingLength > 2) {
						padding.b = paddingVals[2];
					}

					if (paddingLength > 3) {
						padding.l = paddingVals[3];
					}
				}

				var REGEX_DIGITS = /\d+/;

				notify = true;

				if (height !== 'auto') {
					newHeight = toInt(height);
					// We only care about padding.t or padding.b
					// for heights
					var heightUnit = height.replace(REGEX_DIGITS, '');

					var paddingTop = toInt(padding.t);
					var paddingBottom = toInt(padding.b);
					var paddingTopUnit = padding.t.replace(REGEX_DIGITS, '');
					var paddingBottomUnit = padding.b.replace(REGEX_DIGITS, '');

					if (paddingTop > 0 && paddingTopUnit == heightUnit) {
						newHeight += paddingTop;
					}

					if (paddingBottom > 0 && paddingBottomUnit == heightUnit) {
						newHeight += paddingBottom;
					}

					if (newHeight === height) {
						newHeight = 0;
					}
					else {
						newHeightFormatted = newHeight + heightUnit;
					}
				}

				if (width !== 'auto') {
					newWidth = toInt(width);

					var widthUnit = width.replace(REGEX_DIGITS, '');

					var paddingRight = toInt(padding.r);
					var paddingLeft = toInt(padding.l);
					var paddingRightUnit = padding.r.replace(REGEX_DIGITS, '');
					var paddingLeftUnit = padding.l.replace(REGEX_DIGITS, '');

					if (paddingRight > 0 && paddingRightUnit == widthUnit) {
						newWidth += paddingRight;
					}

					if (paddingLeft > 0 && paddingLeftUnit == widthUnit) {
						newWidth += paddingLeft;
					}

					if (newWidth === width) {
						newWidth = 0;
					}
					else {
						newWidthFormatted = newWidth + widthUnit;
					}
				}
			}

			if (notify) {
				log.line(lineStart, 'Padding no longer affects width or height, you may need to change your rule (lines %s)', [lineStart, item.lineEnd].join('-'));

				if (newHeight > 0 && newHeightFormatted !== height) {
					log.line(heightLine, 'You would change height from "%s" to "%s"', height, newHeightFormatted);
				}

				if (newWidth > 0 && newWidthFormatted !== width) {
					log.line(widthLine, 'You would change width from "%s" to "%s"', width, newWidthFormatted);
				}
			}
		}
	);

	content = iterateLines(
		content,
		function(item, index, collection) {
			var fullItem = item;

			var regexCssClass = re.REGEX_CSS_CLASS;

			if (regexCssClass.test(item)) {
				var lineNum = getLineOffset(lineOffset) + index + 1;

				item = item.replace(regexCssClass, function(m, $1, $2) {
					var className = $2;

					_.forEach(
						classNameConvertMap,
						function(item, index, collection) {
							var reg = getRegExp('^' + index + '$', 'g');

							if (reg.test($2)) {
								className = className.replace(reg, item);
							}
						}
					);

					_.forEach(
						re.MAP_REGEX_CLASS_NAMES_CONVERT_CSS,
						function(item, index, collection) {
							var reg = getRegExp(index, 'g');

							var matchRule = reg.test(className);

							if (matchRule) {
								className = className.replace(reg, item);
							}
						}
					);

					if (classNameConvertMap.hasOwnProperty($2)) {
						className = classNameConvertMap[$2];
					}

					if (className != $2) {
						log.line(lineNum, '"%s" has changed to "%s"', $2, className);
					}

					return $1 + className;
				});
			}

			if (item != fullItem && SHOW_DIFF) {
				log.line(log.SUBTLE_LINE_NUM, lineNum, ('diff:'.help) + ' %s', getDiff(fullItem, item));
			}

			return item;
		}
	);

	return content;
};