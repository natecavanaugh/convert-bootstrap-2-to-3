var _ = require('lodash');
var colors = require('cli-color-keywords')();
var Logger = require('content-logger');
var Promise = require('bluebird');
var util = require('util');

var fs = Promise.promisifyAll(require('fs'));

var argv = require('./argv');

var File = require('./file');

var EventEmitter = require('drip').EnhancedEmitter;

var contentLogger = Logger.create({});

var MAP_OMIT = {
	'$0': true,
	'_': true
};

var flags = _.reduce(
	argv,
	function(res, item, index) {
		if (index.length > 1 && !MAP_OMIT[index]) {
			index = _.camelCase(index);

			res[index] = item;
		}

		return res;
	},
	{}
);

class CLI extends EventEmitter {
	constructor(config) {
		super();

		config = config || {};

		this.flags = config.flags || flags;

		this._formatter = require('./formatter')(this.flags.from);

		this._args = config.args || argv._;
		this._cwd = config.cwd || process.cwd();
		this._exec = config.exec || require('child_process').exec;
		this._log = config.log || console.log.bind(console);
		this._logger = config.logger || new contentLogger();
		this._read = config.read || fs.readFileAsync.bind(fs);
		this._write = config.write || fs.writeFileAsync.bind(fs);
	}

	init() {
		var instance = this;

		return Promise.resolve(instance._args)
		.map(
			(item, index) => {
				if (!item.length) {
					item = instance._args[index];
				}

				return item;
			}
		)
		.then(_.flatten)
		.then(
			function(args) {
				instance._args = args;
			}
		)
		.bind(instance)
		.then(instance._start);
	}

	afterFormat(results) {
		var instance = this;

		var series = [];

		if (instance.flags.inlineEdit) {
			series = Promise.reduce(
				results,
				(prev, item, index) => {
					if (item && !item.err && item.contents !== item.data) {
						prev.push(instance.writeFile(item.file, item.contents));
					}

					return prev;
				},
				series
			);
		}

		return Promise.all(series)
				.then(instance.onFinish.bind(instance, results))
				.catch(instance.logGeneralError.bind(instance));
	}

	formatFile(contents, file) {
		var formatter = this._formatter.get(file, this._logger, this.flags);

		if (formatter) {
			contents = this.processFileData(contents, formatter);
		}

		return contents;
	}

	logGeneralError(err) {
		var msg = util.format(colors.error('Something went wrong.\nDetails below:') + '\n%s', err.stack);

		this._log(msg);

		return msg;
	}

	logResults(out, file) {
		if (out) {
			this._log(out);
		}

		var verboseDetails = this._logger.verboseDetails[file];

		if (verboseDetails) {
			this._log(verboseDetails);
		}
	}

	onFinish(results) {
		if (this.flags.open) {
			this.openFiles(results);
		}

		return results;
	}

	onRead(contents, file) {
		return this.formatFile(contents, file);
	}

	onReadError(err, file) {
		var errMsg = File.handleFileReadError(err, file);

		if (errMsg) {
			this._log('');
			this._log(errMsg);
			this._log('');
		}

		return {
			contents: '',
			err,
			file
		};
	}

	openFiles(result) {
		var instance = this;

		var errorFiles = Object.keys(instance._logger.getErrors());

		if (errorFiles.length) {
			instance._exec(
				'git config --get user.editor',
				function(res) {
					instance._exec(
						`open -a "${res[0]}" "${errorFiles.join('" "')}"`
					);
				}
			);
		}
	}

	processFile(file) {
		return this._read(file, 'utf-8')
				.then(_.bindKeyRight(this, 'onRead', file))
				.error(_.bindKeyRight(this, 'onReadError', file));
	}

	processFileData(data, formatter) {
		var file = formatter.file;

		var res = Promise.resolve(formatter.format(data));

		return res.bind(this).then(
			function(contents) {
				this.logResults(this.renderOutput(file), file);

				return {
					contents,
					data,
					file
				}
			}
		);
	}

	renderOutput(file) {
		var flags = this.flags;

		var config = {
			showColumns: flags.showColumns
		};

		var out;

		if (flags.relative) {
			config.relative = this._cwd;
		}

		if (flags.filenames) {
			out = this._logger.renderFileNames(file, config);
		}
		else {
			config.showBanner = flags.quiet;
			config.showLintIds = flags.lintIds;

			out = this._logger.render(file, config);
		}

		return out;
	}

	writeFile(file, contents) {
		return this._write(file, contents)
				.then(_.bind(_.ary(util.format, 2), util, 'Wrote file: %s', file))
				.error(File.handleFileWriteError.bind(this, file))
				.then(_.unary(this._log).bind(this))
	}

	_start() {
		this.emit('init');

		return Promise.all(this._args)
			.bind(this)
			.mapSeries(_.unary(this.processFile))
			.then(this.afterFormat);
	}
};

var cliInstance = new CLI();

cliInstance.CLI = CLI;

module.exports = cliInstance;