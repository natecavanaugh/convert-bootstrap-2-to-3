var base = require('./base');
var path = require('path');
var re = require('./regex');
var util = require('util');

var A = base.A;
var iterateLines = base.iterateLines;
var log = base.log;

var getRegExp = re.getRegExp;
var getDiff = base.getDiff;
var prefix = base.prefix;

var CHECK_VARS = base.CHECK_VARS;
var REMOVE_OLD_VARS = base.REMOVE_OLD_VARS;
var SHOW_DIFF = base.SHOW_DIFF;
var PREFIX_LINE_NUM_SUBTLE = base.PREFIX_LINE_NUM_SUBTLE;

var STR_HAS_CHANGED = base.STR_HAS_CHANGED;
var STR_SUB_HAS_CHANGED = base.STR_SUB_HAS_CHANGED;

module.exports = function(content) {
	var changeMap = {};
	var lineDiffs = {};

	var getChangedVar = function(varName) {
		var newVarName = varName;

		if (newVarName.indexOf('$') !== 0) {
			newVarName = '$' + newVarName;
		}

		var changedVar = changeMap[newVarName];

		if (!changedVar) {
			changedVar = {
				after: null,
				line: 0,
				removed: false
			};

			changeMap[newVarName] = changedVar;
		}

		return changedVar;
	};

	var convertLegacyNames = function(varName) {
		A.Object.each(
			re.MAP_VARS_REPLACE_BEFORE,
			function(item, index, collection) {
				var find = index;
				var replace = item;

				varName = varName.replace(getRegExp(find), replace);
			}
		);

		return varName;
	};

	var mapProcessedLegacyNames = function(varName) {
		if (varName in re.MAP_VARS_REPLACE_AFTER) {
			varName = re.MAP_VARS_REPLACE_AFTER[varName];
		}

		return varName;
	};

	var convertMappedLegacyNames = function(varName) {
		A.Object.each(
			re.MAP_REGEX_VARS_REPLACE_AFTER,
			function(item, index, collection) {
				var find = index;
				var replace = item;

				varName = varName.replace(getRegExp(find), replace);
			}
		);

		return varName;
	};

	var checkProcessedVarRemoved = function(varName) {
		return re.MAP_VARS_REMOVED[varName] || re.REGEX_VARS_REMOVED.test(varName);
	};

	var processed = content.split(/\n/);

	if (CHECK_VARS) {
		var varFile = fs.readFileSync(path.join(__dirname, 'node_modules/bootstrap-sass/vendor/assets/stylesheets/bootstrap/_variables.scss'), 'utf-8');

		var a1 = A.Array.dedupe(processed.join('\n').match(/\$[a-zA-Z0-9_-]+\b/g));
		var a2 = A.Array.dedupe(varFile.match(/\$[a-zA-Z0-9_-]+\b/g));
		console.log(A.Array.partition(a1, function(item, index, collection) {
			return a2.indexOf(item) > -1;
		}));

		return '';

	}

	var convertAlertToState = function(item, index, collection) {
		if (re.REGEX_VARS_DEF.test(item)) {
			var stateMatch = item.match(/^\$state-((?:warning|success|error|info)-(?:bg|border|text))/);

			if (stateMatch) {
				var suffix = stateMatch[1];
				var alertDef = '$alert-' + suffix + ': $state-' + suffix + ';';

				collection.splice(index + 1, 0, alertDef);
			}
		}

		return item;
	};

	var camelKeys = {};
	var dashedKeys = {};

	var convertPaddingVars = function(item, index, collection) {
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

			var changedVar = getChangedVar(varName);

			changedVar.before = dashedKeys[varName.substring(1)];
			changedVar.after = vVarName.substring(1) + ' and ' + hVarName;
		}
	};

	for (var i = 0; i < processed.length; i++) {
		var item = processed[i];
		var fullItem = item;
		var lineNum = i + 1;

		var vars = fullItem.match(/(?:\$)[a-z][a-zA-Z0-9]+\b/g);

		if (vars) {
			A.Array.each(
				vars,
				function(item, index) {
					var camel = item;
					var camelSub = camel.substring(1);
					var dashed = item.toDash();
					var processedVarName = dashed;

					var changedVar = getChangedVar(dashed);

					changedVar.before = camelSub;
					changedVar.line = lineNum;

					processedVarName = convertLegacyNames(processedVarName);
					processedVarName = mapProcessedLegacyNames(processedVarName);
					processedVarName = convertMappedLegacyNames(processedVarName);

					var processedVarNameSub = processedVarName.substring(1);

					camelKeys[camelSub] = processedVarNameSub;
					dashedKeys[processedVarNameSub] = camelSub;

					if (checkProcessedVarRemoved(processedVarNameSub)) {
						changedVar.removed = true;
						log.line(lineNum, '"%s" has been removed', prefix(camelSub, '$').red);
					}
					else {
						if (processedVarName != dashed) {
							camelKeys[camelSub] = processedVarName.substring(1);
							delete dashedKeys[processedVarNameSub];
							dashedKeys[processedVarName.substring(1)] = camelSub;

							changedVar.after = processedVarNameSub;
						}
					}

					fullItem = fullItem.replace(camel, processedVarName);
				}
			);
		}

		fullItem = convertAlertToState(fullItem, i, processed);

		processed[i] = fullItem;

		var varMatch = fullItem.match(/(\$)([a-zA-Z0-9_-]+\b)/g);

		if (varMatch) {
			varMatch.every(
				function(item2, index2, collection) {
					var varName = item2.replace('$', '');

					if (checkProcessedVarRemoved(varName)) {
						if (REMOVE_OLD_VARS) {
							processed.splice(i, 1);
							i -= 1;
						}
						else {
							fullItem = processed[i] = '/* $' + varName + ' has been removed in Bootstrap 3 -- ' + fullItem + ' */';
						}

						return false;
					}

					return true;
				}
			);
		}

		convertPaddingVars(fullItem, i, processed);

		if (item != fullItem && SHOW_DIFF) {
			lineDiffs[i] = getDiff(fullItem, item);
		}
	}

	content = processed.join('\n');

	A.Object.each(
		changeMap,
		function(item, index) {
			var lineNum = item.line;
			var message = '';
			var after = item.after;
			var before = prefix(item.before, '$');

			if (!item.removed && after) {
				log.line(lineNum, STR_HAS_CHANGED, before, prefix(after, '$'));
			}

			var lineDiff = lineDiffs[lineNum];

			if (lineDiff) {
				log(util.format(PREFIX_LINE_NUM_SUBTLE, lineNum), util.format(('diff:'.help) + ' %s', lineDiff));
			}
		}
	);

	return content;
};