
var requireList = [
	'./js/codemirror',
	'./js/brace-fold',
	'./js/closebrackets',
	'./js/comment',
	'./js/dialog',
	'./js/foldcode',
	'./js/hardwrap',
	'./js/javascript',
	'./js/search',
	'./js/sublime'
]
// // require(['codemirror']);
define(requireList,function(CodeMirror) {
	return CodeMirror;
});