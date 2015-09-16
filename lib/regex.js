var base = require('./base');
var _ = base._;

var _regexCache = {};

function getRegExp(str, flags) {
	flags = flags || '';
	_regexCache = _regexCache || {};

	var regex = _regexCache[str + flags];

	if (!regex) {
		regex = new RegExp(str, flags);

		_regexCache[str + flags] = regex;
	}
	else if (flags.indexOf('g') > -1) {
		regex.lastIndex = 0;
	}

	return regex;
}

var regexMap = {
	getRegExp: getRegExp,

	MAP_CLASS_NAMES_CONVERT: {
		'row-fluid': 'row',
		'bar': 'progress-bar',
		'brand': 'navbar-brand',
		'nav-collapse': 'navbar-collapse',
		'nav-toggle': 'navbar-toggle',
		'btn-navbar': 'navbar-btn',
		'hero-unit': 'jumbotron',
		'btn-mini': 'btn-xs',
		'btn-small': 'btn-sm',
		'btn-large': 'btn-lg',
		'alert-error': 'alert-danger',
		'visible-phone': 'visible-xs',
		'visible-tablet': 'visible-sm',
		'hidden-phone': 'hidden-xs',
		'hidden-tablet': 'hidden-sm',
		'input-block-level': 'form-control',
		'control-group': 'form-group',
		'add-on': 'input-group-addon',
		'img-polaroid': 'img-thumbnail',
		'unstyled': 'list-unstyled',
		'inline': 'list-inline',
		'muted': 'text-muted',
		'label-important': 'label-danger',
		'text-error': 'text-danger',
		'accordion': 'panel-group',
		'accordion-heading': 'panel-heading',
		'accordion-body': 'panel-collapse',
		'accordion-inner': 'panel-body'
	},

	MAP_REGEX_CLASS_NAMES_CONVERT_HTML: {
		'^span(.+)$': 'col-md-$1',
		'^offset(.+)$': 'col-md-offset-$1',
		'^bar-(.*)': 'progress-bar-$1',
		'^control-group (warning|error|success)': 'form-group has-$1',
		'^input-(append|prepend)( input-(append|prepend))?': 'input-group',
		'^(checkbox|radio) inline': '$1-inline'
	},

	MAP_REGEX_CLASS_NAMES_CONVERT_CSS: {
		'span(\d{1,})$': 'col-md-$2',
		'offset(\d{1,})$': 'col-md-offset-$2',
		'bar-(.*)': 'progress-bar-$2',
		'control-group\.(warning|error|success)': 'form-group.has-$2',
		'input-(append|prepend)(\.input-(append|prepend))?': 'input-group',
		'(checkbox|radio)\.inline': '$2-inline'
	},

	MAP_VARS_REMOVED: {
		'alt-font-family': true,
		'black': true,
		'blue': true,
		'blue-dark': true,
		'green': true,
		'red': true,
		'yellow': true,
		'orange': true,
		'pink': true,
		'purple': true,
		'white': true,
		'btn-inverse-bg': true,
		'dropdown-divider-bottom': true,
		'font-size-mini': true,
		'form-actions-bg': true,
		'navbar-collapse-desktop-width': true,
		'navbar-collapse-width': true,
		'icon-sprite-path': true,
		'icon-white-sprite-path': true
		// navbar-inverse-search-*
		// *-highlight
		// (fluid-grid-column-width1200|fluid-grid-column-width768|fluid-grid-column-width|fluid-grid-gutter-width1200|fluid-grid-gutter-width768|fluid-grid-gutter-width|grid-column-width1200|grid-column-width768|grid-column-width|grid-gutter-width1200|grid-gutter-width768|grid-row-width1200|grid-row-width768|grid-row-width)
	},

	MAP_VARS_REPLACE_BEFORE: {
		'(.*)-background': '$1-bg',
		'hero-unit': 'jumbotron'
	},

	MAP_VARS_REPLACE_AFTER: {
		'jumbotron-lead-color': 'jumbotron-color',
		'input-disabled-bg': 'input-bg-disabled',
		'input-height': 'input-height-base',
		'table-border': 'table-border-color',
		'zindex-modal-backdrop': 'zindex-modal-background',
		'zindex-fixed-navbar': 'zindex-navbar-fixed',
		'placeholder-text': 'input-color-placeholder',
		'dropdown-divider-top': 'dropdown-divider-bg',
		'horizontal-component-offset': 'component-offset-horizontal',
		'link-color-hover': 'link-hover-color',
		'mono-font-family': 'font-family-monospace',
		'sans-font-family': 'font-family-sans-serif',
		'serif-font-family': 'font-family-serif',
		'navbar-inverse-text': 'navbar-inverse-color',
		'navbar-text': 'navbar-default-color',
		'padding-mini': 'padding-xs'
	},

	MAP_REGEX_VARS_REPLACE_AFTER: {
		'base-(.*)\\b': '$1-base',
		'navbar-(bg|border|brand-color|link-.*)': 'navbar-default-$1',
		'navbar-link-(.*)': 'navbar-default-link-$1',
		'dropdown-link-(bg|color)-(active|hover)': 'dropdown-link-$2-$1',
		'navbar-(default|inverse)-link-(bg|color)-(active|hover)': 'navbar-$1-link-$3-$2',
		'btn-(bg|border)': 'btn-default-$1',

		'^(warning|success|error|info)-(bg|border|text)': 'state-$1-$2',
		'state-error-(bg|border|text)': 'state-danger-$1'

		// 'padding-(xs|small|large)': 'padding-$1-(horizontal|vertical)'

	},

	REGEX_BTN_CLASS: getRegExp('\\bbtn-(default|primary|danger|info|warning|success|link)\\b'),

	REGEX_CSS_CLASS: getRegExp('(\\.)([a-zA-Z][a-zA-Z0-9-.]+)', 'g'),

	REGEX_EXT_CSS: /\.(s)?css$/,
	REGEX_EXT_HTML: /\.(jsp.?|html|vm|ftl|tpl|tmpl)$/,
	REGEX_EXT_JS: /\.js$/,

	REGEX_HTML_ATTRIBUTES: /\b(([A-Za-z0-9-]+)=(["'])([^"']+)\3)/g,

	REGEX_VARS: /(\$)([a-zA-Z0-9_-]+\b)/g,
	REGEX_VARS_DEF: /^(\$)([a-zA-Z0-9_-]+\b): [^;]+;$/,
	REGEX_VARS_REMOVED: /(.*-highlight|navbar-inverse-search-.*|fluid-grid-.*|grid-(column|row)-width(\d+)?|grid-gutter-width(768|1200))/g
};

regexMap.REGEX_VARS_REMOVED_KEYS = getRegExp('\\$(' + Object.keys(regexMap.MAP_VARS_REMOVED).join('|').replace(/\$/g, '') + ')');

regexMap.MAP_CLASS_NAMES_CONVERT_HTML = _.assign(
	regexMap.MAP_CLASS_NAMES_CONVERT,
	{
		// Kinda dicey ones
		'visible-desktop': 'visible-md visible-lg',
		'hidden-desktop': 'hidden-md hidden-lg',

		'btn': 'btn btn-default',
		// 'label': 'label label-default',
		'accordion-group': 'panel panel-default'

		// Still need to handle
		// 'icon-*': 'glyphicon .glyphicon-*',
		// 'table .error': 'table .danger',
	}
);

regexMap.MAP_CLASS_NAMES_CONVERT_JS = _.assign(
	regexMap.MAP_CLASS_NAMES_CONVERT,
	{
		// Kinda dicey ones
		'visible-desktop': 'visible-md visible-lg',
		'hidden-desktop': 'hidden-md hidden-lg',

		'btn': 'btn btn-default',
		// 'label': 'label label-default',
		'accordion-group': 'panel panel-default'

		// Still need to handle
		// 'icon-*': 'glyphicon .glyphicon-*',
		// 'table .error': 'table .danger',
	}
);

regexMap.MAP_CLASS_NAMES_CONVERT_CSS = _.assign(
	regexMap.MAP_CLASS_NAMES_CONVERT,
	{
		// Kinda dicey ones
		'visible-desktop': 'visible-md.visible-lg',
		'hidden-desktop': 'hidden-md.hidden-lg',

		// Not sure if these are needed for CSS itself (def for HTML though)
		// 'btn': 'btn.btn-default',
		// 'label': 'label.label-default',
		'accordion-group': 'panel.panel-default'

		// Still need to handle
		// 'icon-*': 'glyphicon .glyphicon-*',
		// 'table .error': 'table .danger',
	}
);

module.exports = regexMap;