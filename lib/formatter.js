require('./formatters/css');
require('./formatters/html');
require('./formatters/js');

var Formatter = require('content-formatter');

var re = require('roolz');

var RULES = require('./rules');

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

module.exports = Formatter;