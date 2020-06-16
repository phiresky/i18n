import {
	enableHotReload,
	getReloadCount,
	hotRequireExportedFn,
	registerUpdateReconciler,
} from "@hediet/node-reload";
import { Disposable } from "@hediet/std/disposable";
import { commands, ExtensionContext, window } from "vscode";

if (process.env.HOT_RELOAD) {
	enableHotReload({ entryModule: module, loggingEnabled: true });
}

import { MakeTranslatable } from "./MakeTranslatable";
registerUpdateReconciler(module);

export class Extension {
	public readonly dispose = Disposable.fn();

	constructor() {
		if (getReloadCount(module) > 0) {
			const i = this.dispose.track(window.createStatusBarItem());
			i.text = `reload${getReloadCount(module)}`;
			i.show();
		}
		this.dispose.track(
			commands.registerCommand(
				"hediet-i18n-helper.make-translatable",
				() => {
					void new MakeTranslatable().run();
				},
			),
		);
	}
}

export function activate(context: ExtensionContext): void {
	context.subscriptions.push(
		hotRequireExportedFn(module, Extension, (Extension) => new Extension()),
	);
}

export function deactivate(): void {}
