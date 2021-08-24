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
			let endLine = sections.hasOwnProperty(i + 1)
        ? sections[i + 1].line - 1
        : document.lineCount - 1;
			while (document.lineAt(endLine).isEmptyOrWhitespace && endLine >= section.line + 1) {
				endLine--;
			}
			return new vscode.FoldingRange(section.line, endLine);
		});
	}

	private async getBlockFoldingRanges(document: vscode.TextDocument): Promise<vscode.FoldingRange[]> {
		const tokens = await this._engine.tokenizeDocument(document);
    const ranges: vscode.FoldingRange[] = [];
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (token.level > tokens[index - 1].level) {
        for (let subindex = index; subindex < tokens.length; subindex++) {
          const subtoken = tokens[subindex];
          if (subtoken.level < token.level) {
            const range = new vscode.FoldingRange(token.line, tokens[subindex - 1].line, this.getFoldingRangeKind(token));
            ranges.push(range);
          }
        }
      }
    }
    return ranges;
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

function isSectionHeader(entry: TocEntry, i: number) {
  return entry.type === vscode.SymbolKind.String;
}
