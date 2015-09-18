var _ = require('lodash');
var colors = require('cli-color-keywords')();
var Formatter = require('content-formatter');
var sub = require('string-sub');

var REGEX = require('../regex');

var getRegExp = REGEX.getRegExp;

var base = require('../base');

var getDiff = base.getDiff;
var iterateLines = base.iterateLines;
var prefix = base.prefix;

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
				content = this._convertVars(content, index, collection, logger);

				return content;
			},

			_checkProcessedVarRemoved: function(varName) {
				return REGEX.MAP_VARS_REMOVED[varName] || REGEX.REGEX_VARS_REMOVED.test(varName);
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

					var hLine = hVarName + ': ' + hVal + ';';
					var vLine = vVarName + ': ' + vVal + ';';

					item = vLine + ' ' + hLine;

					var changedVar = this._getChangedVar(varName);

					changedVar.after = vVarName.substring(1) + ' and ' + hVarName;
					changedVar.before = this._dashedKeys[varName.substring(1)];
					changedVar.line = index + 1;
				}

				return item;
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
							var dashed = prefix(_.kebabCase(item), '$');
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

								logger(lineNum, sub('"{0}" has been removed', prefix(camelSub, '$')));
							}
							else if (processedVarName != dashed) {
								instance._camelKeys[camelSub] = processedVarName.substring(1);
								delete instance._dashedKeys[processedVarNameSub];
								instance._dashedKeys[processedVarName.substring(1)] = camelSub;

								changedVar.after = processedVarNameSub;
							}

							fullItem = fullItem.replace(camel, processedVarName);
						}
					);
				}

				fullItem = instance._convertAlertToState(fullItem, index, collection);

				fullItem = instance._convertPaddingVars(fullItem, index, collection);

				if (content != fullItem && instance.flags.diff) {
					instance._lineDiffs[index] = getDiff(fullItem, content);
				}

				return fullItem;
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
						var after = item.after;
						var before = prefix(item.before, '$');
						var lineNum = item.line;

						if (!item.removed && after) {
							logger(lineNum, sub(STR_SUB_HAS_CHANGED, before, prefix(after, '$')));
						}

						var lineDiff = instance._lineDiffs[lineNum];

						if (lineDiff) {
							logger(lineNum, sub('diff: {0}', lineDiff));
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

				var collection = _.reduce(
					contents.split('\n'),
					function(result, item, index) {
						var varMatch = item.match(/(\$)([a-zA-Z0-9_-]+\b)/g);

						var keepItem = true;

						if (varMatch) {
							varMatch.every(
								function(item2, index2) {
									var varName = item2.replace('$', '');

									if (instance._checkProcessedVarRemoved(varName)) {
										if (instance.flags.removeold) {
											keepItem = false;
										}
										else {
											item = '/* $' + varName + ' has been removed in Bootstrap 3 -- ' + item + ' */';
										}

										return false;
									}

									return true;
								}
							);
						}

						if (keepItem) {
							result.push(item);
						}

						return result;
					},
					[]
				);

				return collection.join('\n');
			}
		}
	}
);

module.exports = Formatter.VARS;