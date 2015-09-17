var Formatter = require('content-formatter');
var sub = require('string-sub');
var toInt = require('to-int');

var base = require('../base');

var iterateLines = base.iterateLines;

Formatter.CSS = Formatter.create(
	{
		id: 'css',
		includes: /\.s?css$/,
		prototype: {
			format: function(contents, lineOffset) {
				var instance = this;

				instance._lineOffset = lineOffset || 0;

				require('./vars');

				var logger = this.log.bind(this);

				instance._extractRecursive(contents, '{', '}', true).forEach(
					function(item, index) {
						instance._checkPadding(item, index);
					}
				);

				contents = iterateLines(
					contents,
					function(item, index, collection) {
						return instance.processFile(item, index, collection, logger);
					}
				);

				if (Formatter.VARS && instance.flags.variables) {
					var varsFormatter = new Formatter.VARS(instance.file, instance.logger, instance.flags);

					contents = varsFormatter.format(contents);
				}

				return contents;
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

				var lineStart = item.lineStart;
				var str = item.str || item;

				if (str.indexOf('content-box') > -1) {
					return;
				}

				var paddingMatch = str.match(/padding(?:-(right|left|top|bottom))?:\s?(.*?);/);
				var sizeMatch = str.match(/(?:^|\s)(height|width):\s?(.*?);/g);

				var notify = false;

				var height = 'auto';
				var newHeight = 0;
				var newHeightFormatted = '';
				var newWidth = 0;
				var newWidthFormatted = '';
				var width = 'auto';

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
						b: '0',
						l: '0',
						r: '0',
						t: '0'
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

						var paddingBottom = toInt(padding.b);
						var paddingBottomUnit = padding.b.replace(REGEX_DIGITS, '');
						var paddingTop = toInt(padding.t);
						var paddingTopUnit = padding.t.replace(REGEX_DIGITS, '');

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

						var paddingLeft = toInt(padding.l);
						var paddingLeftUnit = padding.l.replace(REGEX_DIGITS, '');
						var paddingRight = toInt(padding.r);
						var paddingRightUnit = padding.r.replace(REGEX_DIGITS, '');

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
					var lineOffset = instance._lineOffset;

					instance.log(lineOffset + lineStart, sub('Padding no longer affects width or height, you may need to change your rule (lines {0})', [lineOffset + lineStart, lineOffset + item.lineEnd].join('-')));

					if (newHeight > 0 && newHeightFormatted !== height) {
						instance.log(lineOffset + heightLine, sub('You would change height from "{0}" to "{1}"', height, newHeightFormatted));
					}

					if (newWidth > 0 && newWidthFormatted !== width) {
						instance.log(lineOffset + widthLine, sub('You would change width from "{0}" to "{1}"', width, newWidthFormatted));
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

				var closeChar = close.substring(0, 1);
				var openChar = open.substring(0, 1);

				var re = new RegExp(instance._escapeRegEx(open) + '((?=([^' + instance._escapeRegEx(openChar + closeChar) + ']+))\\2)*?' + instance._escapeRegEx(close));

				var results = [];

				includeDetails = !!includeDetails;

				while (match = re.exec(str)) {
					var replace = '';
					var result = match[1] || '';

					if (includeDetails) {
						var index = match.index;

						var lineEnd = instance._getLineNum(str, index + result.length);
						var lineStart = instance._getLineNum(str, index);

						replace = result.replace(/[^\n]/g, '');

						result = {
							index: match.index,
							lineEnd: lineEnd,
							lineStart: lineStart,
							str: result
						};
					}

					results.push(result);

					str = str.replace(match[0], replace);
				}

				return results;
			},

			_getContext: function(content, index, collection) {
				return {
					collection: collection,
					content: content,
					file: this.file,
					index: index,
					lineNum: index + 1 + this._lineOffset
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