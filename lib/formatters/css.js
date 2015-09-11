var Formatter = require('content-formatter');
var sub = require('string-sub');

var base = require('../base');

var iterateLines = base.iterateLines;
var toInt = base.toInt;

Formatter.CSS = Formatter.create(
	{
		id: 'css',
		includes: /\.s?css$/,
		prototype: {
			format: function(contents) {
				var instance = this;

				var logger = this.log.bind(this);

				instance._extractRecursive(contents, '{', '}', true).forEach(
					function(item, index) {
						instance._checkPadding(item, index);
					}
				);

				return iterateLines(
					contents,
					function(item, index, collection) {
						return instance.processFile(item, index, collection, logger);
					}
				);
			},

			processFile: function(content, index, collection, logger) {
				var re = this._re;

				var rawContent = content;

				var context = this._getContext(rawContent, index, collection);

				context.rawContent = rawContent;

				rawContent = re.iterateRules('css', context);

				return rawContent;
			},

			_checkPadding: function(item, index) {
				var instance = this;

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
								var itemLineNum = (instance._getLineNum(str, str.indexOf(item)) - 1) + lineStart;

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
					instance.log(lineStart, sub('Padding no longer affects width or height, you may need to change your rule (lines {0})', [lineStart, item.lineEnd].join('-')));

					if (newHeight > 0 && newHeightFormatted !== height) {
						instance.log(heightLine, sub('You would change height from "{0}" to "{1}"', height, newHeightFormatted));
					}

					if (newWidth > 0 && newWidthFormatted !== width) {
						instance.log(widthLine, sub('You would change width from "{0}" to "{1}"', width, newWidthFormatted));
					}
				}
			},

			_escapeRegEx: function(str) {
				return str.replace(/([.*+?^$(){}|[\]\/\\])/g, '\\$1');
			},

			_extractRecursive: function(str, open, close, includeDetails) {
				var instance = this;

				if (open == close) {
					throw new Error('open and close arguments cannot be the same');
				}

				var openChar = open.substring(0, 1);
				var closeChar = close.substring(0, 1);
				var re = new RegExp(instance._escapeRegEx(open) + '((?=([^' + instance._escapeRegEx(openChar + closeChar) + ']+))\\2)*?' + instance._escapeRegEx(close));

				var results = [];

				includeDetails = !!includeDetails;

				while (match = re.exec(str)) {
					var result = match[1] || '';
					var replace = '';

					if (includeDetails) {
						var index = match.index;
						var lineStart = instance._getLineNum(str, index);
						var lineEnd = instance._getLineNum(str, index + result.length);

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
			},

			_getContext: function(content, index, collection) {
				return context = {
					collection: collection,
					content: content,
					file: this.file,
					index: index,
					lineNum: index + 1
				};
			},

			_getLineNum: function(str, index) {
				if (index) {
					str = str.substring(0, index);
				}

				return str.split('\n').length;
			}
		}
	}
);

module.exports = Formatter.CSS;