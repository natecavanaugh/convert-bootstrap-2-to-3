var _ = require('lodash');
var async = require('async');
var colors = require('cli-color-keywords')();
var fs = require('fs');
var Logger = require('content-logger');
var util = require('util');

var argv = require('./argv');

var File = require('./file');
var Formatter = require('./formatter');

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

_.mixin(
	{
		bindRight: function(fn, context) {
			var args = _.toArray(arguments).slice(2);

			args.unshift(_.bind(fn, context));

			return _.partialRight.apply(_, args);
		}
	}
);

var CLI = function(config) {
	config = config || {};

	this.flags = config.flags || flags;

	this._args = config.args || argv._;
	this._async = config.async || async;
	this._cwd = config.cwd || process.cwd();
	this._exec = config.exec || require('child_process').exec;
	this._log = config.log || console.log.bind(console);
	this._logger = config.logger || new contentLogger();
	this._read = config.read || fs.readFile.bind(fs);
	this._write = config.write || fs.writeFile.bind(fs);
};

CLI.prototype = {
	constructor: CLI,

	init: function() {
		var instance = this;

		var series = instance._args.map(
			function(file) {
				return instance.processFile.bind(instance, file);
			}
		);

		instance._async.series(series, instance.onFinish.bind(instance));
	},

	formatFile: function(file, data, done) {
		var formatter = Formatter.get(file, this._logger, this.flags);

		if (formatter) {
			this.processFileData(data, formatter, done);
		}
	},

	logGeneralError: function(err) {
		var msg = '';

		if (err) {
			msg = util.format(colors.error('Something went wrong.\nDetails below:') + '\n%s', err.stack);

			this._log(msg);
		}

		return msg;
	},

	logResults: function(out, file) {
		if (out) {
			this._log(out);
		}

		var verboseDetails = this._logger.verboseDetails[file];

		if (verboseDetails) {
			this._log(verboseDetails);
		}
	},

	onFinish: function(err, results) {
		this.logGeneralError(err);

		if (this.flags.open) {
			this.openFiles(err, results);
		}
	},

	onRead: function(err, data, file, done) {
		if (err) {
			done = file;
			file = data;

			this.onReadError(err, file);

			done();
		}
		else {
			this.formatFile(file, data, done);
		}
	},

	onReadError: function(err, file) {
		var errMsg = File.handleFileReadError(err, file);

		if (errMsg) {
			this._log('');
			this._log(errMsg);
			this._log('');
		}
	},

	onWrite: function(err, file, done) {
		var writeResults = '';

		if (err) {
			writeResults = File.handleFileWriteError(err, file);
		}
		else {
			writeResults = util.format('Wrote file: %s', file);
		}

		this._log(writeResults);

		if (_.isFunction(done)) {
			done();
		}
	},

	openFiles: function(err, result) {
		var instance = this;

		var errorFiles = Object.keys(instance._logger.getErrors());

		if (errorFiles.length) {
			instance._exec(
				'git config --get user.editor',
				function(res) {
					instance._exec(
						'open -a "' + res[0] + '" "' + errorFiles.join('" "') + '"'
					);
				}
			);
		}
	},

	processFile: function(file, done) {
		this._read(file, 'utf-8', _.bindRight(this.onRead, this, file, done));
	},

	processFileData: function(data, formatter, done) {
		var file = formatter.file;

		var contents = formatter.format(data);

		this.logResults(this.renderOutput(file), file);

		if (contents !== data && this.flags.inlineEdit) {
			this.writeFile(file, contents, done);
		}
		else {
			done();
		}
	},

	renderOutput: function(file) {
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
	},

	writeFile: function(file, contents, done) {
		this._write(file, contents, _.bindRight(this.onWrite, this, file, done));
	}
};

var cliInstance = new CLI();

cliInstance.CLI = CLI;

module.exports = cliInstance;