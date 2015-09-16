var optimist = require('optimist')
			.usage('Usage: $0 -qo')
			.options(
				{
					d: {
						alias: 'diff',
						boolean: true,
						default: false
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