var path = require('path');

module.exports = function(version) {
	var versionPath = path.join('versions', 'v' + version);

	require(`./${versionPath}/formatters/css`);
	require(`./${versionPath}/formatters/html`);
	require(`./${versionPath}/formatters/js`);

	var Formatter = require('content-formatter');

	var re = require('roolz');

	var RULES = require(`./${versionPath}/rules`);

	Formatter.on(
		'init',
		function(instance) {
			var ruleInstance = new re(RULES);

			instance._re = ruleInstance;

			instance.proxyEvent('message', ['re'], ruleInstance);

			instance.on(
				're:message',
				function(data) {
					instance.log(data.context.lineNum, data.message);
				}
			);
		}
	);

	return Formatter;
};