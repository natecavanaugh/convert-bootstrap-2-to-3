var _ = require('lodash');

var checkVersion = function(args) {
	var res;

	var from = _.toSafeInteger(args.from);

	if (!_.inRange(from, 2, 4)) {
		res = false;
	}

	return res;
};

checkVersion.toString = function() {
	return 'This module doesn\'t support upgrading from the version you passed in. It must be 2 or 3';
};

var optimist = require('optimist')
			.usage('Usage: $0 -qo')
			.check(
				checkVersion
			)
			.options(
				{
					d: {
						alias: 'diff',
						boolean: true,
						default: false
					},
					f: {
						alias: 'from',
						default: 2
					},
					i: {
						alias: 'inline-edit',
						boolean: true,
						default: false
					},
					o: {
						alias: 'open',
						boolean: true,
						default: false
					},
					q: {
						alias: 'quiet',
						boolean: true,
						default: false
					},
					removeold: {
						boolean: true,
						default: false
					},
					v: {
						alias: 'variables',
						boolean: true,
						default: true
					}
				}
			);

var argv = optimist.argv;

if (argv.h || argv.V) {
	if (argv.h) {
		optimist.showHelp();
	}
	else if (argv.V) {
		console.log(require('../package.json').version);
	}

	process.exit();
}

module.exports = argv;