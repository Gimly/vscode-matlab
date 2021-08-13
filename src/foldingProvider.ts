'use strict';

import * as vscode from 'vscode';
import * as vsctm from 'vscode-textmate';
import { IMatlabToken, MatlabEngine, matlabTokens, matlabTokenSymbolKind } from './matlabEngine';
import { TableOfContentsProvider } from './tableOfContentsProvider';

const rangeLimit = 5000;

export type MatlabFoldingToken = {
	isStart: boolean,
	line: number
};

export default class MatlabFoldingProvider implements vscode.FoldingRangeProvider {

	constructor(
		private _engine: MatlabEngine
	) { }

	public async provideFoldingRanges(
		document: vscode.TextDocument,
		_: vscode.FoldingContext,
		_token: vscode.CancellationToken
	): Promise<vscode.FoldingRange[]> {
		const foldables = await Promise.all([
			this.getRegions(document),
			this.getHeaderFoldingRanges(document),
			this.getBlockFoldingRanges(document)
		]);
		return foldables.flat().slice(0, rangeLimit);
	}

	private async getRegions(document: vscode.TextDocument): Promise<vscode.FoldingRange[]> {
		const tokens = this._engine.tokenizeDocument(document);
		const regionMarkers = tokens.filter(isRegionMarker).map(token => ({
			line: token.lineNumber,
			isStart: isStartRegion(token.text)
		}));

		const nestingStack: MatlabFoldingToken[] = [];
		return regionMarkers
			.map(marker => {
				marker.line = marker.line;
				if (marker.isStart) {
					nestingStack.push(marker);
				} else if (nestingStack.length && nestingStack[nestingStack.length - 1].isStart) {
					return new vscode.FoldingRange(nestingStack.pop()!.line, marker.line, vscode.FoldingRangeKind.Region);
				} else {
					// noop: invalid nesting (i.e. [end, start] or [start, end, end])
				}
				return null;
			})
			.filter((region: vscode.FoldingRange | null): region is vscode.FoldingRange => !!region);
	}

	private async getHeaderFoldingRanges(document: vscode.TextDocument) {
		const tocProvider = new TableOfContentsProvider(document, this._engine);
		const toc = await tocProvider.getToc();
		return toc.map(entry => {
			let endLine = entry.location.range.end.line;
			if (document.lineAt(endLine).isEmptyOrWhitespace && endLine >= entry.line + 1) {
				endLine = endLine - 1;
			}
			return new vscode.FoldingRange(entry.line, endLine);
		});
	}

	private async getBlockFoldingRanges(document: vscode.TextDocument): Promise<vscode.FoldingRange[]> {
		const tokens = this._engine.tokenizeDocument(document);
		return tokens.filter((token, i) => token.scope !== tokens[i - 1].scope).map((listItem, i, foldingTokens) => {
      const start = listItem.lineNumber;
      let end: number = i + 1;
      for (let j = i + 2; j < foldingTokens.length; j++) {
        if (foldingTokens[j - 1].scope === listItem.scope) {
          end = foldingTokens[j].lineNumber;
          break;
        }
        if (j === foldingTokens.length - 1) {
          end = document.lineCount - 1;
        }
      };
      return new vscode.FoldingRange(start, end, this.getFoldingRangeKind(listItem));
		});
	}

	private getFoldingRangeKind(listItem: IMatlabToken): vscode.FoldingRangeKind | undefined {
		return listItem.type === matlabTokens.commentBlock
			? vscode.FoldingRangeKind.Comment
			: undefined;
	}
}

const isStartRegion = (text: string): boolean => /^\s*#?region\b/.test(text);
const isEndRegion = (text: string): boolean => /^\s*#?end\s?region\b/.test(text);

function isRegionMarker(token: IMatlabToken): boolean {
	return (
		token.type === matlabTokens.inlineComment
		&& (isStartRegion(token.text) || isEndRegion(token.text))
	);
}
