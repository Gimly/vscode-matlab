'use strict';

import vscode = require('vscode');
import path = require('path');
import cp = require('child_process');
import iconv = require('iconv-lite');

import { window } from 'vscode';

export interface ICheckResult {
	file: string;
	line: number;
	column: [number, number];
	msg: string;
	severity: string
}

export function check(document: vscode.TextDocument, lintOnSave = true, mlintPath = ""): Promise<ICheckResult[]> {
	var matlabLint = !lintOnSave ? Promise.resolve([]) : new Promise((resolve, reject) => {
		var filename = document.uri.fsPath;

		let matlabConfig = vscode.workspace.getConfiguration('matlab');

		let args: string[] = ['-all'];
		args.push('-id');
		if (matlabConfig.has('linterConfig') && matlabConfig['linterConfig'] != null) {
			args.push(`-config=${matlabConfig['linterConfig']}`);
		}

		args.push(filename);

		let fileEncoding = 'utf8';
		if (matlabConfig.has('linterEncoding') && matlabConfig['linterEncoding'] != null) {
			fileEncoding = matlabConfig['linterEncoding'];
		}

		cp.execFile(
			mlintPath,
			args,
			{ encoding: 'buffer' },
			(err: Error, stdout, stderr) => {
				try {
					let errorsString = iconv.decode(stderr, fileEncoding);
					var errors = errorsString.split('\n');
					var ret = [];
					errors.forEach(error => {
						var regex = /L (\d+) \(C (\d+)-?(\d+)?\): (\S+): (.*)/;
						var match = regex.exec(error);
						if (match != null) {
							var [_, lineStr, startCol, endCol, idErrorWarn, msg] = match;
							var line = +lineStr;
							if (endCol == null) {
								endCol = startCol;
							}
							var errorsIds = ["SYNER", "NOPAR2", "NOPAR", "ENDCT2", "1MCC", "AFADJLMS", "AFAP", "AFAPRU", "AFBAP", "AFBLMS", "AFBLMSFFT", "AFDLMS", "AFFDAF", "AFFILTXLMS", "AFFTF",
								"AFGAL", "AFHRLS", "AFHSWRLS", "AFLMS", "AFLSL", "AFNLMS", "AFPBFDAF", "AFPBUFDAF", "AFQRDLSL", "AFQRDRLS", "AFRLS", "AFSD", "AFSE", "AFSS", "AFSWFTF", "AFSWRLS", "AFTDAFDCT", "AFTFAFDFT", "AFUFDAF", "ATNPI", "ATNPP",
								"ATPPP", "ATUNK", "ATVIZE", "BADCH", "BADFP", "BADHB", "BADNE", "BADNOT", "BADOT", "BETALIK1", "BRKCONT", "BUFSIZE", "CAPABLE", "CLASSREGTREE", "CLSUNK", "CLTWO", "CMELGTS", "CMGTS", "CMMMTS", "CMPSKCPS", "COEFF",
								"COMMSCOPESP", "CTORO", "DAFINF", "DAVIINF", "DBCHDEC", "DBHENC", "DBITMAX", "DCMIX", "DEFSIZE", "DEMLC", "DEMLMEX", "DEXIFRD", "DFEATUREPARAM", "DGRAPHICSVER", "DISGVER", "DLDPCDEC", "DLDPCENC", "DMCHN", "DNDLA",
								"DNOANI", "DPOOL", "DPSD", "DRNDINT", "DRSDEC", "DRSENC", "DSPDF", "DSPFDF", "DWVFINF", "DWVRD", "DWVWR", "EMGRO", "EMLOAD", "EMNODEF", "EMNSI", "EMSCR", "EMTC", "EMVDF", "ERTXT", "EWMAPLOT", "FAFD", "FALFD", "FCONF",
								"FCONV", "FEGLO", "FINS", "FISST", "FITNAIVEBAYES", "FNAN", "FNDOT", "FNSWA", "GETERR", "GPFST", "H5PGET", "H5PSET", "HDFGD", "HDFSD", "HDFSW", "HESS", "IDXCOLND", "INDWT", "INDWT2", "ISGLOB", "LEGINTPAR", "LHROW",
								"LINPROG", "LSQLIN", "MATPOOL", "MCANI", "MCAPP", "MCASC", "MCCBD", "MCCBS", "MCCBU", "MCCMC", "MCCSOP", "MCDIR", "MCEB", "MCFIL", "MCG1I", "MCG1O", "MCGSA", "MCHLP", "MCKBD", "MCMSP", "MCPIN", "MCPRD", "MCPSG", "MCS1O",
								"MCS2I", "MCSCC", "MCSCF", "MCSCM", "MCSCN", "MCSCO", "MCSCT", "MCSGA", "MCSGP", "MCSVP", "MCSWA", "MFFDCM", "MFFINTRP", "MHERIT", "MNANC", "MOVIE2", "MSYSTEM", "MTAGS1", "MTAGS2", "MTHDPOOL", "MTMAT", "MWKREF", "NCHKOS",
								"NDWT", "NDWT2", "NOLHS", "NOPRV", "NPERS", "OBJMPOOL", "OPTMNVP", "OPTMOPT", "OPTMSLV", "PFBFN", "PFBR", "PFCEL", "PFCODA", "PFCODN", "PFDF", "PFEVC", "PFIFN", "PFLD", "PFNACK", "PFNAIO", "PFNF", "PFNST", "PFPIE", "PFRFH",
								"PFRNC", "PFRNG", "PFSAME", "PFSV", "PFTIN", "PFTUSE", "PFUIXE", "PFUNK", "PFXST", "POLYCS", "POLYREP", "PRINCOMP", "PRMNOIN", "PROBDIST", "PROBDISTKERNEL", "PROBDISTPARAMETRIC", "PROBDISTUNIVKERNEL", "PROBDISTUNIVPARAM", "QAMDEP",
								"QDEMOD", "QMOD", "QUADPROG", "READSZ", "REDEF", "RHSFN", "ROWLN", "SBTMP", "SCHART", "SEPEXR", "SETERR", "SLRTBNCH", "SMPLMODE", "SODFLTVAL", "SOINITPROP", "SONUMIN", "SONUMOUT", "SPBFN", "SPBRK", "SPDEC", "SPDEC3", "SPEVC",
								"SPGP", "SPIFN", "SPLD", "SPNF", "SPNST", "SPRET", "SPSV", "SPWHOS", "SUBSASGN", "SVMCLASSIFY", "SVMSMOSET", "SVMTRAIN", "SYNEND", "TINVALDIM", "TREEDISP", "TREEFIT", "TREEPRUNE", "TREETEST", "TREEVAL", "TTOOFEWDIMS", "TWOCM",
								"VARARG", "VTPCON", "VTPEAL", "VTPUA", "WEIBCDF", "WEIBFIT", "WEIBINV", "WEIBLIKE", "WEIBPDF", "WEIBPLOT", "WEIBRND", "WEIBSTAT", "WLGC", "WTXT", "XBARPLOT"];
							if (errorsIds.includes(idErrorWarn)) {
								ret.push({ file: filename, line, column: [+startCol, +endCol], msg, severity: "error" });
							}
							else {
								ret.push({ file: filename, line, column: [+startCol, +endCol], msg, severity: "warning" });
							}
						}
					});
					resolve(ret);
				}


				catch (error) {
					console.error(error);
					reject(error);
				}
			});
	});

	return Promise.all([matlabLint]).then(resultSets => [].concat.apply([], resultSets));
}
