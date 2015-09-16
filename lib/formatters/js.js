var Formatter = require('content-formatter');

var base = require('../base');

var iterateLines = base.iterateLines;

Formatter.JS = Formatter.create(
	{
		id: 'js',
		includes: /\.js$/,
		prototype: {
			format: function(contents, lineOffset) {
				var instance = this;

				instance._lineOffset = lineOffset || 0;

				var logger = this.log.bind(this);

				contents = iterateLines(
					contents,
					function(item, index, collection) {
						return instance.processFile(item, index, collection, logger);
					}
				);

				return contents;
			},

			processFile: function(content, index, collection, logger) {
				var re = this._re;

				var rawContent = content;

				var context = this._getContext(rawContent, index, collection);

				context.rawContent = rawContent;

				rawContent = re.iterateRules('js', context);

				return rawContent;
			},

			_getContext: function(content, index, collection) {
				return {
					collection: collection,
					content: content,
					file: this.file,
					index: index,
					lineNum: index + 1 + this._lineOffset
				};
			}
		}
	}
);

module.exports = Formatter.JS;