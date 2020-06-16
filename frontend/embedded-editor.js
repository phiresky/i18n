/** This file is licensed under MIT. */

module.exports.setEmbeddedTranslationEditorSocket = function (socket) {
	global.$embeddedTranslationEditorSocket = socket;
};

module.exports.getEmbeddedTranslationEditorSocket = function () {
	return global.$embeddedTranslationEditorSocket;
};
