'use strict';

import { IOnigLib } from 'vscode-textmate';
import * as vscodeOnigurumaModule from 'vscode-oniguruma';
import * as fs from 'fs';
import * as path from 'path';

let onigurumaLib: Promise<IOnigLib> | null = null;

export function getOniguruma(): Promise<IOnigLib> {
	if (!onigurumaLib) {
		const wasmBin = fs.readFileSync(path.join(__dirname, '../../node_modules/vscode-oniguruma/release/onig.wasm')).buffer;
		onigurumaLib = (<Promise<any>>vscodeOnigurumaModule.loadWASM(wasmBin)).then((_: any) => {
			return {
				createOnigScanner(patterns: string[]) { return new vscodeOnigurumaModule.OnigScanner(patterns); },
				createOnigString(s: string) { return new vscodeOnigurumaModule.OnigString(s); }
			};
		});
	}
	return onigurumaLib;
}
