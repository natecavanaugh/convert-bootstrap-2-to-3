var base = require('./base');
var re = require('./regex');

var A = base.A;
var iterateLines = base.iterateLines;
var log = base.log;

var getRegExp = re.getRegExp;
var getDiff = base.getDiff;
var getLineOffset = base.getLineOffset;

var SHOW_DIFF = base.SHOW_DIFF;
var PREFIX_LINE_NUM = base.PREFIX_LINE_NUM;

var STR_HAS_CHANGED = base.STR_HAS_CHANGED;

module.exports = function(content, file, lineOffset) {
	var hasJs = (/<(aui:)?script>([\s\S]*?)<\/\1script>/).test(content);

	if (hasJs) {
		var checkJs = require('./js');

		content.replace(
			/<(aui:)?script[^>]*?>([\s\S]*?)<\/\1script>/g,
			function(m, tagNamespace, body, index) {
				body = body.replace(/<%=[^>]+>/g, '_')
							.replace(/<portlet:namespace \/>/g, '_')
							.replace(/\$\{.*?\}/g, '_')
							.replace(/<%[^>]+>/g, '/* scriptlet block */')
							.replace(/<\/?[A-Za-z0-9-_]+:[^>]+>/g, '/* jsp tag */');

				checkJs(body, file, content.substring(0, index).split('\n').length - 1);
			}
		);
	}

	var hasCss = (/<style>([\s\S]*?)<\/style>/).test(content);

	if (hasCss) {
		var checkCss = require('./css');

		content.replace(
			/<style[^>]*?>([\s\S]*?)<\/style>/g,
			function(m, body, index) {
				body = body.replace(/<%=[^>]+>/g, '_')
							.replace(/<portlet:namespace \/>/g, '_')
							.replace(/\$\{.*?\}/g, '_')
							.replace(/<%[^>]+>/g, '/* scriptlet block */')
							.replace(/<\/?[A-Za-z0-9-_]+:[^>]+>/g, '/* jsp tag */');

				checkCss(body, file, content.substring(0, index).split('\n').length - 1);
			}
		);
	}

	var classNameConvertMap = re.MAP_CLASS_NAMES_CONVERT_HTML;

	var REGEX_VARS_CONVERTED = getRegExp('(position=)?(["\'\\s])(' + Object.keys(classNameConvertMap).join('|') + ')(["\'\\s])', 'g');

	content = iterateLines(
		content,
		function(item, index, collection) {
			var fullItem = item;

			item = item.trim();

			var lineNum = getLineOffset(lineOffset) + index + 1;

			var token = String.fromCharCode(-1);

			var m = fullItem.match(/<%.*?%>/g);

			var filteredItem = fullItem;

			var matches = m && m.map(
				function(item, index, collection) {
					filteredItem = filteredItem.replace(item, token + index + token);

					return item;
				}
			);

			var newLine = filteredItem.replace(
				/\b(([A-Za-z0-9-]+)=(["'])([^"']+)\3)/g,
				function(m, attr, attrName, quote, attrValue) {
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

								if (item2 != newItem) {
									log.line(lineNum, STR_HAS_CHANGED, item2, newItem);
								}

								return newItem;
							}
						);

						attrValue = attrValuePiecesFiltered.join(' ');
					}

					full = attrName + '=' + quote + attrValue + quote;

					return full;
				}
			);

			var tmpRE = getRegExp(A.Object.values(classNameConvertMap).join('|') + '|btn btn-.*');

			if (REGEX_VARS_CONVERTED.test(newLine) && !tmpRE.test(newLine)) {
				newLine = newLine.replace(
					REGEX_VARS_CONVERTED,
					function(m, $1, $2, $3, $4) {
						if ($1) {
							return m;
						}

						return $2 + (classNameConvertMap[$3] || $3) + $4;
					}
				);
			}

			if (matches) {
				newLine = newLine.replace(
					new RegExp(token + '(\\d+)' + token, 'g'),
					function(str, id) {
						return matches[id];
					}
				);
			}

			if (newLine != fullItem && SHOW_DIFF) {
				log.line(log.SUBTLE_LINE_NUM, lineNum, ('diff:'.help) + ' %s', getDiff(fullItem, newLine));
			}

			return newLine;
		}
	);

	return content;
};