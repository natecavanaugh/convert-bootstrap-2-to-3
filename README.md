convert-bootstrap-2-to-3
========================

## Description

Convert Bootstrap 2 variables, class names and HTML to Bootstrap 3

## Installation

```
<sudo> npm install -g convert-bootstrap-2-to-3
```

## Running

The simplest way to run it is:

```
bs3 path/to/file
```

However, you can also check multiple files at once:

```
find . -name '*.css' | xargs bs3
```

or with options:

```
find . -name '*.css' | xargs -J{} bs3 {} -di
```

## Options

There are some options that you can pass to the command:

`-q, --quiet` will set it so that it only shows files that have changes. By default it will log out all files and report 'clear' if there are no changes.

`-o, --open` If you have an editor specified in your gitconfig (under user.editor), this will open all of the files that need changes in your editor.

`-i, --inline-edit` For some of the changes (mainly the ones that can be safely changed), if you pass this option, it will modify the file and convert the old value to the new equivalent.
I would recommend running this only on files that are checked into git or some VCS, as it may edit something incorrectly, and with the file in VCS, you can at least pick and choose which changes you'd like to keep.

`-v, --variables` This option, which is **true by default** will try to convert variables to their new equivalents (including the camelCased to dashed-base style of your variables), and will comment out (or remove, if you pass an additional option) variables that have been removed in Bootstrap 3.
If you wish to have the CSS ignore variables, go ahead and pass either `--no-v` or `--no-variables`.

### Experimental or less used options

`-d, --diff` This will display a colored diff of what would be changed on the line. This can get a bit noisy, but is useful if you want to see what will be changed by passing `-i`.

`--removeold` This will, if `--variables` is set, remove the entire line that old variables are on. Be careful with this, as it will remove not just var declarations, but any usage of the variable, so something like `background: $white;` would be deleted.

## Known issues and Caveats

- Does not handle HTML or CSS inside of Java or JavaScript files (still trying to think of how to best handle these cases, since it can be tough to tell what "mode" it should process in and look for).
- JavaScript parsing is still currently the weakest portion. The issue stems from the fact that CSS selectors can be used (for querying the DOM), or HTML fragments can be created. However, parsing `.btn` and `btn` (as an example), when technically, the first could be a property of an object, and the second could be a variable name.
So token parsing in this case is a little tough.
- Dynamically created strings will more than likely be skipped, so something like:
```
<span class="btn <%= buttonType %>"></span>
```
would get flagged (since it's inside of a class attribute, and it can't tell if `buttonType` contains "btn-default" or "btn-primary", etc) and this:
```
<%
	String cssClass = "btn";

	if (buttonType == "default") {
		cssClass += " btn-default";
	}
%>
<span class="<%= cssClass %>"></span>
```
would not get flagged either (since the parser looks at attributes, but doesn't know their dynamically calculated values).
- While it will check code inside of `style` tags and `script` tags (including `aui:script`), it won't be able to replace them, but it will output a message telling you what line the change needs to be made (and diff will still work)
