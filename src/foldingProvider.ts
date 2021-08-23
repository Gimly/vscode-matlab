'use strict';

import * as vscode from 'vscode';
import * as vsctm from 'vscode-textmate';
import { IMatlabToken, TextmateEngine, matlabTokens } from './textmateEngine';
import { TableOfContentsProvider, TocEntry } from './tableOfContentsProvider';

const rangeLimit = 5000;

export type MatlabFoldingToken = {
	isStart: boolean,
	line: number
};

export class MatlabFoldingProvider implements vscode.FoldingRangeProvider {

	constructor(
		private _engine: TextmateEngine
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
		return [].concat(...foldables).slice(0, rangeLimit);
	}

	private async getRegions(document: vscode.TextDocument): Promise<vscode.FoldingRange[]> {
		const tokens = await this._engine.tokenizeDocument(document);
		const regionMarkers = tokens.filter(isRegionMarker).map(token => ({
			line: token.line,
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
		const sections = toc.filter(isSectionHeader);
		return sections.map((section, i) => {
			let endLine = sections[i + 1] ? sections[i + 1].line : document.lineCount;
			while (document.lineAt(endLine).isEmptyOrWhitespace && endLine >= section.line + 1) {
				endLine--;
			}
			return new vscode.FoldingRange(section.line, endLine);
		});
	}

	private async getBlockFoldingRanges(document: vscode.TextDocument): Promise<vscode.FoldingRange[]> {
		const tokens = await this._engine.tokenizeDocument(document);
		return tokens.filter(isFoldingBlock.bind(tokens)).map((listItem, i, foldingTokens) => {
      const start = listItem.line;
      let end: number = i + 1;
      for (let j = i + 2; j < foldingTokens.length; j++) {
        if (foldingTokens[j - 1].level === listItem.level) {
          end = foldingTokens[j].line;
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

function isSectionHeader(token: TocEntry, i: number) {
  return token.type === vscode.SymbolKind.String;
}

function isFoldingBlock(this: TocEntry[], token: TocEntry, i: number) {
  return token.level !== (this[i - 1] || this[i + 1]).level;
}
