## Next Release
* No changes
***

## v1.0.3 - May 12, 2016

* Fix: resolved issue where illegal operations on directories were halting further processing of other files
* Update: improved error messages of read/write errors

## v1.0.2 - November 10, 2015

* Change main file to lib/cli.js for programmatically invoking, necessary because of npm 3.x flat dependency tree

## v1.0.1 - October 19, 2015

* done callback was being called twice, causing issues with running the converter programmatically

## v1.0.0 - October 16, 2015

* Merge pull request #3 from bingocaller/support-erb-files
* Add support for .erb-files.
* When changing padding vars, add both variables to the same line so the line number doesn't appear wrong in logs
* Ensuring that dashed variable is still prefixed with $ (_.kebabCase strips special characters)
* Adding basic test infrastructure
* Fix log message for changed classes in html
* Already have this in lodash
* Removing methods we no longer need to maintain
* Removing unused functions
* Removing update notifier
* Use cli-color-keywords in place of colors module
* No longer need colors module
* Remove unnecessary properties from base.js
* Add back check for dash
* Fix removeold vars functionality
* Shouldn't have removed
* Fix background variable
* Removing unnecessary re.js file
* Add cli-color-keywords
* Let _exec be configurable
* Remove old index.js
* Only run vars formatter if variables flag is true
* inlineEdit/open file functionality
* Change order
* Removing unnecessary code
* Point bs3 command to new index.js
* Rename regex_new to regex
* Removing old files
* Add lineOffset for js and css formatters for running in html context
* Migrate html formatter
* SF
* Migrate js formatter/rules
* Abstract css class replacer
* Migrate vars formatter
* Put css formatter into it's own file
* Bring over padding checker as is for now
* Refactoring to use roolz, content-formatter, content-logger, string-sub
* Put argv logic into own file, add help and version commands
* Using lodash for utilities instead of YUI

## v0.0.2 - July 3, 2014

* Checking to see if width/height are set with padding
* Making sure we don't accidentally grab the wrong value
* Update readme and package.json
* Add update-notifier
* Add ability to check CSS and JS inside of HTML files
* Allow passing -o to open files, and remove verbose option
* Removing dead code, handling logging a bit better
* Add subtle line number handling for showing diffs
* Update diff handling (still not wonderful, though)
* Refactor var handling, still kinda hokey, but better than before
* Adding file extension checks
* Log the needed changes instead of showing the diff, but still allow the printing of the diff
* Handle the odd case where a matched CSS class also exists as an Object property
* Defaulting vars to true for css (can be overwritten with --no-v or --no-variables) and other additions
* Removing stdin handling, just parse the arguments as files
* More general cleanup
* General cleanup
* Adding code, package.json and .gitignore
* Initial commit