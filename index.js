#!/usr/bin/env node

var async = require('async');

var fs = require('fs');

var re = require('./lib/regex');
var base = require('./lib/base');

var getRegExp = re.getRegExp;
var getDiff = base.getDiff;
var iterateLines = base.iterateLines;
var log = base.log;

var YUI = require('yui').YUI;
var A = YUI().use('yui-base', 'oop', 'array-extras');

var argv = base.argv;

var args = base.args;

var VARS = base.VARS;
var CSS_CLASS_NAMES = base.CSS_CLASS_NAMES;
var HTML_CLASS_NAMES = base.HTML_CLASS_NAMES;
var JS_CLASS_NAMES = base.JS_CLASS_NAMES;
var CHECK_VARS = base.CHECK_VARS;
var REMOVE_OLD_VARS = base.REMOVE_OLD_VARS;
var VERBOSE = base.VERBOSE;
var INLINE_REPLACE = base.INLINE_REPLACE;
var SHOW_DIFF = base.SHOW_DIFF;

var PREFIX_LINE_NUM = base.PREFIX_LINE_NUM;

var convertCss = require('./lib/css');
var convertHtml = require('./lib/html');
var convertJs = require('./lib/js');
var convertVars = require('./lib/vars');

function processContent(content) {
	var processed = content;

	if (VARS) {
		processed = convertVars(processed);
	}

	if (CSS_CLASS_NAMES) {
		processed = convertCss(processed);
	}

	if (HTML_CLASS_NAMES) {
		processed = convertHtml(processed);
	}

	if (JS_CLASS_NAMES) {
		processed = convertJs(processed);
	}

	return processed;
}

var series = args.map(
	function(file) {
		return function(cb) {
			if (VERBOSE) {
				console.log(file.help);
			}

			fs.readFile(file, 'utf-8', function (err, data) {
				if (err) {
					return cb(err);
				}

				var formatter;

				if (re.REGEX_EXT_CSS.test(file)) {
					formatter = function(content, file) {
						content = convertCss(content, file);

						if (VARS) {
							content = convertVars(content, file);
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

				var content = formatter(data, file);

				var changed = (content != data);

				if (changed) {
					console.log('File:'.blackBG + ' ' + file.underline);

					log.flush(true);

					console.log('----'.subtle);
				}

				if (INLINE_REPLACE && changed) {
					fs.writeFile(file, content, function(err, result) {
						if (err) {
							return cb(err);
						}

						cb(null, content);
					});
				}
				else {
					cb(null, content);
				}
			});
		};
	}
);

async.series(series, function(err, result) {
	// console.log(result);
});