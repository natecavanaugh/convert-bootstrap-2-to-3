#!/usr/bin/env node

var cli = require('../lib/cli').init().then(
	function(results) {
		if (results.EXIT_WITH_FAILURE === true) {
			process.exitCode = 1;
		}
	}
);