var base = require('./base');
var path = require('path');
var re = require('./regex');

var A = base.A;
var iterateLines = base.iterateLines;
var log = base.log;

var getRegExp = re.getRegExp;
var getDiff = base.getDiff;

var CHECK_VARS = base.CHECK_VARS;
var REMOVE_OLD_VARS = base.REMOVE_OLD_VARS;
var SHOW_DIFF = base.SHOW_DIFF;
var PREFIX_LINE_NUM = base.PREFIX_LINE_NUM;

module.exports = function(content) {
	var changes = [];

	content = iterateLines(
		content,
		function(item, index, collection) {
			item = item.replace(/(?:\$)[a-z][a-zA-Z0-9]+\b/g, function(m, str) {
				var newStr = m.toDash();

				if (newStr != m) {
					changes.push(A.Lang.sub('  {0} -> {1}', [m, m.toDash()]));
				}

				return newStr;
			});

			item = item.replace(
				re.REGEX_VARS,
				function(m, $1, $2) {
					var varName = $2;

					A.Object.each(
						re.MAP_VARS_REPLACE_BEFORE,
						function(item, index, collection) {
							var find = index;
							var replace = item;

							varName = varName.replace(getRegExp(find), replace);
						}
					);

					if (varName in re.MAP_VARS_REPLACE_AFTER) {
						varName = re.MAP_VARS_REPLACE_AFTER[varName];
					}

					A.Object.each(
						re.MAP_REGEX_VARS_REPLACE_AFTER,
						function(item, index, collection) {
							var find = index;
							var replace = item;

							varName = varName.replace(getRegExp(find), replace);
						}
					);

					if (varName != $2) {
						changes.push(A.Lang.sub('  {0} -> {1}', [$2, varName]));
					}

					return $1 + varName;
				}
			);
			return item;
		}
	);

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

	for (var i = 0; i < processed.length; i++) {
		var item = processed[i];

		if (re.REGEX_VARS_DEF.test(item)) {
			var stateMatch = item.match(/^\$state-((?:warning|success|error|info)-(?:bg|border|text))/);

			if (stateMatch) {
				var suffix = stateMatch[1];
				var alertDef = '$alert-' + suffix + ': $state-' + suffix + ';';

				processed.splice(i + 1, 0, alertDef);
			}
		}

		var varMatch = item.match(/(\$)([a-zA-Z0-9_-]+\b)/g);

		if (varMatch) {
			varMatch.every(
				function(item2, index2, collection) {
					var varName = item2.replace('$', '');

					if (re.MAP_VARS_REMOVED[varName] || re.REGEX_VARS_REMOVED.test(varName)) {
						if (REMOVE_OLD_VARS) {
							processed.splice(i, 1);
							i -= 1;
						}
						else {
							processed[i] = '/* $' + varName + ' has been removed in Bootstrap 3 -- ' + item + ' */';
						}

						changes.push(A.Lang.sub('  removed {0}', [varName]).error);

						return false;
					}

					return true;
				}
			);
		}

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

			processed[i] = vLine;
			processed.splice(i, 0, hLine);

			log(A.Lang.sub('changed {0} to {1}\n\t{2}', [varName + origValue, vLine, hLine]));
		}
	}

	content = processed.join('\n');

	if (changes.length) {
		log(changes.join('\n'));
	}

	return content;
};