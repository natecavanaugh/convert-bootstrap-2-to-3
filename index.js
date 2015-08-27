#!/usr/bin/env node

var async = require('async');
var cli = require('cli');

var fs = require('fs');

var re = require('./lib/regex');
var base = require('./lib/base');

var getRegExp = re.getRegExp;
var getDiff = base.getDiff;
var iterateLines = base.iterateLines;
var log = base.log;

var updateNotifier = require('update-notifier');

var notifier = updateNotifier();

if (notifier.update) {
	notifier.notify(true);
}

var argv = base.argv;

var args = base.args;

var VARS = base.VARS;
var QUIET = base.QUIET;
var INLINE_REPLACE = base.INLINE_REPLACE;

var INDENT = log.INDENT;

var PREFIX_LINE_NUM = base.PREFIX_LINE_NUM;

var convertCss = require('./lib/css');
var convertHtml = require('./lib/html');
var convertJs = require('./lib/js');
var convertVars = require('./lib/vars');

var trackedFiles = {};

var series = args.map(
	function(file) {
		return function(cb) {
			fs.readFile(
				file,
				'utf-8',
				function(err, data) {
					if (err) {
						return cb(err);
					}

					var formatter;

					if (re.REGEX_EXT_CSS.test(file)) {
						formatter = function(content, file, lineOffset) {
							content = convertCss(content, file, lineOffset);

							if (VARS) {
								content = convertVars(content, file, lineOffset);
							}

							return content;
						};
					}
					else if (re.REGEX_EXT_JS.test(file)) {
						formatter = convertJs;
					}
					else if (re.REGEX_EXT_HTML.test(file)) {
						formatter = convertHtml;
					}

					var content = formatter(data, file, 0);

					var changed = (content != data);

					var logSize = log.size();

					var includeHeaderFooter = (logSize || !QUIET);

					if (includeHeaderFooter) {
						console.log('File:'.blackBG + ' ' + file.underline);
					}

					if (logSize) {
						log.flush(true);

						trackedFiles[file] = true;
					}
					else if (includeHeaderFooter) {
						console.log(INDENT + 'clear');
					}

					if (includeHeaderFooter) {
						console.log('----'.subtle);
					}

					if (INLINE_REPLACE && changed) {
						fs.writeFile(
							file,
							content,
							function(err, result) {
								if (err) {
									return cb(err);
								}

								cb(null, content);
							}
						);
					}
					else {
						cb(null, content);
					}
				}
			);
		};
	}
);

var callback = function() {};

if (base.OPEN_FILES) {
	callback = function(err, result) {
		var filesToOpen = Object.keys(trackedFiles);

		if (filesToOpen.length) {
			cli.exec(
				'git config --get user.editor',
				function(res) {
					cli.exec(
						'open -a "' + res[0] + '" "' + filesToOpen.join('" "') + '"'
					);
				}
			);
		}
	};
}

async.series(series, callback);