var _ = require('lodash');
var Formatter = require('content-formatter');
var sub = require('string-sub');

var REGEX = require('../regex');

var getRegExp = REGEX.getRegExp;

var base = require('../base');

var getDiff = base.getDiff;
var getLineOffset = base.getLineOffset;
var prefix = base.prefix;
var iterateLines = base.iterateLines;
var toInt = base.toInt;

var PREFIX_LINE_NUM_SUBTLE = base.PREFIX_LINE_NUM_SUBTLE;
var REMOVE_OLD_VARS = base.REMOVE_OLD_VARS;
var SHOW_DIFF = base.SHOW_DIFF;
var STR_SUB_HAS_CHANGED = base.STR_SUB_HAS_CHANGED;

Formatter.VARS = Formatter.create(
	{
		id: 'vars',
		includes: /\.s?css$/,
		prototype: {
			format: function(contents) {
				var instance = this;

				instance._camelKeys = {};
				instance._changeMap = {};
				instance._dashedKeys = {};
				instance._lineDiffs = {};

				var logger = this.log.bind(this);

				contents = iterateLines(
					contents,
					function(item, index, collection) {
						return instance.processFile(item, index, collection, logger);
					}
				);

				instance._logChanges(logger);

				contents = instance._processRemovedVars(contents);

				return contents;
			},

			processFile: function(content, index, collection, logger) {
				var re = this._re;

				content = this._convertVars(content, index, collection, logger);

				return content;
			},

			_checkProcessedVarRemoved: function(varName) {
				return REGEX.MAP_VARS_REMOVED[varName] || REGEX.REGEX_VARS_REMOVED.test(varName);
			},

			_convertVars: function(content, index, collection, logger) {
				var instance = this;

				var lineNum = index + 1;

				var fullItem = content;

				var vars = content.match(/(?:\$)[a-z][a-zA-Z0-9]+\b/g);

				if (vars) {
					_.forEach(
						vars,
						function(item, index) {
							var camel = item;
							var camelSub = camel.substring(1);
							var dashed = item.toDash();
							var processedVarName = dashed;

							var changedVar = instance._getChangedVar(dashed);

							changedVar.before = camelSub;
							changedVar.line = lineNum;

							processedVarName = instance._convertLegacyNames(processedVarName);
							processedVarName = instance._mapProcessedLegacyNames(processedVarName);
							processedVarName = instance._convertMappedLegacyNames(processedVarName);

							var processedVarNameSub = processedVarName.substring(1);

							instance._camelKeys[camelSub] = processedVarNameSub;
							instance._dashedKeys[processedVarNameSub] = camelSub;

							if (instance._checkProcessedVarRemoved(processedVarNameSub)) {
								changedVar.removed = true;

								logger(lineNum, sub('"{0}" has been removed', prefix(camelSub, '$').red));
							}
							else {
								if (processedVarName != dashed) {
									instance._camelKeys[camelSub] = processedVarName.substring(1);
									delete instance._dashedKeys[processedVarNameSub];
									instance._dashedKeys[processedVarName.substring(1)] = camelSub;

									changedVar.after = processedVarNameSub;
								}
							}

							fullItem = fullItem.replace(camel, processedVarName);
						}
					);
				}

				fullItem = instance._convertAlertToState(fullItem, index, collection);

				instance._convertPaddingVars(fullItem, index, collection);

				if (content != fullItem && SHOW_DIFF) {
					instance._lineDiffs[index] = getDiff(fullItem, content);
				}

				return fullItem;
			},

			_convertAlertToState: function(item, index, collection) {
				if (REGEX.REGEX_VARS_DEF.test(item)) {
					var stateMatch = item.match(/^\$state-((?:warning|success|error|info)-(?:bg|border|text))/);

					if (stateMatch) {
						var suffix = stateMatch[1];
						var alertDef = '$alert-' + suffix + ': $state-' + suffix + ';';

						collection.splice(index + 1, 0, alertDef);
					}
				}

				return item;
			},

			_convertLegacyNames: function(varName) {
				_.forEach(
					REGEX.MAP_VARS_REPLACE_BEFORE,
					function(item, index, collection) {
						var find = index;
						var replace = item;

						varName = varName.replace(getRegExp(find), replace);
					}
				);

				return varName;
			},

			_convertMappedLegacyNames: function(varName) {
				_.forEach(
					REGEX.MAP_REGEX_VARS_REPLACE_AFTER,
					function(item, index, collection) {
						var find = index;
						var replace = item;

						varName = varName.replace(getRegExp(find), replace);
					}
				);

				return varName;
			},

			_convertPaddingVars: function(item, index, collection) {
				var paddingMatch = item.match(/^(\$)(padding-(xs|small|large|base)):([^;]+);/);

				if (paddingMatch) {
					var varName = paddingMatch[1] + paddingMatch[2];
					var hVarName = varName + '-horizontal';
					var vVarName = varName + '-vertical';
					var value = paddingMatch[4].trim();
					var origValue = value;

					var hasDefault = value.indexOf('!default') > -1;

					var vals = value.replace('!default', '').trim().split(' ');
					var hVal = vals[0];
					var vVal = vals[0];

					if (vals.length > 1) {
						hVal = vals[1];
					}

					if (hasDefault) {
						hVal += ' !default';
						vVal += ' !default';
					}

					var vLine = vVarName + ': ' + vVal + ';';
					var hLine = hVarName + ': ' + hVal + ';';

					processed[index] = vLine;
					processed.splice(index, 0, hLine);

					var changedVar = this._getChangedVar(varName);

					changedVar.before = instance._dashedKeys[varName.substring(1)];
					changedVar.after = vVarName.substring(1) + ' and ' + hVarName;
				}
			},

			_getChangedVar: function(varName) {
				var newVarName = varName;

				if (newVarName.indexOf('$') !== 0) {
					newVarName = '$' + newVarName;
				}

				var changedVar = this._changeMap[newVarName];

				if (!changedVar) {
					changedVar = {
						after: null,
						line: 0,
						removed: false
					};

					this._changeMap[newVarName] = changedVar;
				}

				return changedVar;
			},

			_logChanges: function(logger) {
				var instance = this;

				_.forEach(
					this._changeMap,
					function(item, index) {
						var lineNum = item.line;
						var message = '';
						var after = item.after;
						var before = prefix(item.before, '$');

						if (!item.removed && after) {
							logger(lineNum, sub(STR_SUB_HAS_CHANGED, before, prefix(after, '$')));
						}

						var lineDiff = instance._lineDiffs[lineNum];

						if (lineDiff) {
							logger(log.SUBTLE_LINE_NUM, lineNum, ('diff:'.help) + ' %s', lineDiff);
						}
					}
				);
			},

			_mapProcessedLegacyNames: function(processedVarName) {
				var varName = processedVarName.substring(1, processedVarName.length);

				if (REGEX.MAP_VARS_REPLACE_AFTER.hasOwnProperty(varName)) {
					processedVarName = '$' + REGEX.MAP_VARS_REPLACE_AFTER[varName];
				}

				return processedVarName;
			},

			_processRemovedVars: function(contents) {
				var instance = this;

				var collection = contents.split('\n');

				_.forEach(
					collection,
					function(item, index) {
						var varMatch = item.match(/(\$)([a-zA-Z0-9_-]+\b)/g);

						if (varMatch) {
							varMatch.every(
								function(item2, index2) {
									var varName = item2.replace('$', '');

									if (instance._checkProcessedVarRemoved(varName)) {
										if (REMOVE_OLD_VARS) {
											collection.splice(index, 1);
											index -= 1;
										}
										else {
											item = collection[index] = '/* $' + varName + ' has been removed in Bootstrap 3 -- ' + item + ' */';
										}

										return false;
									}

									return true;
								}
							);
						}
					}
				)

				return collection.join('\n');
			}
		}
	}
);

module.exports = Formatter.VARS;