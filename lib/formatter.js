var _ = require('lodash');
var Formatter = require('content-formatter');
var sub = require('string-sub');

var base = require('./base');
var REGEX = require('./regex_new');

var getDiff = base.getDiff;
var getLineOffset = base.getLineOffset;
var iterateLines = base.iterateLines;
var log = base.log;
var SHOW_DIFF = base.SHOW_DIFF;
var toInt = base.toInt;

var getRegExp = REGEX.getRegExp;

Formatter.CSS = Formatter.create(
	{
		id: 'css',
		includes: /\.s?css$/,
		prototype: {
			format: function(contents) {
				var instance = this;

				var logger = this.log.bind(this);

				return iterateLines(
					contents,
					function(item, index, collection) {
						return instance.processFile(item, index, collection, logger);
					}
				);
			},

			processFile: function(content, index, collection, logger) {
				var re = this._re;

				var rawContent = content;

				var context = this._getContext(rawContent, index, collection);

				context.rawContent = rawContent;

				rawContent = re.iterateRules('css', context);

				return rawContent;
			},

			_getContext: function(content, index, collection) {
				return context = {
					collection: collection,
					content: content,
					file: this.file,
					index: index,
					lineNum: index + 1
				};
			}
		}
	}
);

var re = require('./re');

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