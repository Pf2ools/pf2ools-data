const JSON_ESCAPES = {
	"—": "\\u2014", // Em dash
	"–": "\\u2013", // En dash
	"−": "\\u2212", // Minus sign
};
const JSON_REPLACEMENTS = {
	"‑": "-", // Non-breaking hyphen --> hyphen
	"“": '\\"',
	"”": '\\"',
	"’": "'",
	"‘": "'",
	"…": "...",
	" ": " ", // Non-breaking space --> space
	"\t": " ", // Tab --> space
	ﬀ: "ff",
	ﬃ: "ffi",
	ﬄ: "ffl",
	ﬁ: "fi",
	ﬂ: "fl",
	Ĳ: "IJ",
	ĳ: "ij",
	Ǉ: "LJ",
	ǈ: "Lj",
	ǉ: "lj",
	Ǌ: "NJ",
	ǋ: "Nj",
	ǌ: "nj",
	ﬅ: "ft",
};
const JSON_ESCAPES_REGEX = new RegExp(Object.keys(JSON_ESCAPES).join("|"), "g");
const JSON_REPLACEMENTS_REGEX = new RegExp(Object.keys(JSON_REPLACEMENTS).join("|"), "g");

function getCleanFile(file) {
	return (
		JSON.stringify(
			JSON.parse(
				// JSON.parse() automatically converts "\u###" to string literals
				file
					.replace(/\s{2,}/g, " ") // Remove consecutive whitespace
					.replace(JSON_REPLACEMENTS_REGEX, (match) => JSON_REPLACEMENTS[match]), // Replace unwanted characters
			),
			(key, value) => {
				if (typeof value !== "string") return value;
				return value.trim(); // Remove leading and trailing whitespace in strings
			},
			"\t",
		).replace(JSON_ESCAPES_REGEX, (match) => JSON_ESCAPES[match]) + "\n" // Re-escape chosen characters
	);
}

// Generic everything else below

import chalk from "chalk";
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";

// Define CLI
const program = new Command()
	.summary("clean data for Pf2ools")
	.description(
		'Sanitises and regularises a file or directory of files against the Pf2ools schema. Only JSON files will be tested.\n\nChanges made:\n\t- Ligatures and non-breaking variants are replaced with their standard characters\n\t- Dashes and minus signs are replaced with Unicode escape codes ("\\u####")\n\t- All other Unicode escape codes are converted into literal characters\n\t- Strings are trimmed of leading and trailing whitespace\n\t- All consecutive whitespace is collapsed to a single space',
	)
	.argument("<paths...>", "File or directory paths to clean")
	.option("-c, --changes", "Suppress printing of unchanged files")
	.option("-d, --dry-run", "Prevent any modifications being written to the disk")
	.option("-r, --recurse", "Recursively clean files in directories")
	.option("-s, --summary", "Suppress printing of cleaning status for all files and only summarise results")
	.parse(process.argv);

// File-tree-walker to find JSONs
function getJSONsRecursively(targetPath) {
	let fileList = [];
	fs.readdirSync(targetPath).forEach((file) => {
		const filePath = path.join(targetPath, file);
		if (fs.statSync(filePath).isDirectory()) {
			fileList = fileList.concat(getJSONsRecursively(filePath));
		} else if (isJSON(filePath)) {
			fileList.push(filePath);
		}
	});
	return fileList;
}
function isJSON(filename) {
	return path.extname(filename) === ".json";
}

// Load and validate arguments
const opts = program.opts();
let filePaths = [];
for (const arg of program.args) {
	const argClean = path.join(...arg.toString().split(path.sep));
	let filePoint;
	try {
		filePoint = fs.statSync(argClean);
	} catch {
		program.error(chalk.red(`"${argClean}" not found`), {
			exitCode: 1,
			code: "invalid.path",
		});
	}
	if (filePoint.isDirectory()) {
		if (opts.recurse) {
			filePaths = filePaths.concat(getJSONsRecursively(argClean));
		} else {
			filePaths = filePaths.concat(
				fs
					.readdirSync(argClean)
					.filter((file) => isJSON(file))
					.map((file) => path.join(argClean, file)),
			);
		}
	} else if (!isJSON(argClean)) {
		program.error(chalk.red(`"${argClean}" is not a JSON file`), {
			exitCode: 1,
			code: "invalid.file",
		});
	} else {
		filePaths.push(argClean);
	}
}
if (!filePaths.length) {
	console.log(chalk.blue("No JSON files to test"));
	process.exit();
}

const unchanged = `\t${chalk.blue("[Unchanged]")}  `;
const cleaned = `\t${chalk.green("[Cleaned]")}  `;
let cleanCount = 0;
for (const filePath of filePaths) {
	const file = fs.readFileSync(filePath, { encoding: "utf-8" });
	const cleanFile = getCleanFile(file);
	if (cleanFile === file) {
		if (!opts.changes && !opts.summary) console.log(chalk.dim(unchanged + filePath));
	} else {
		if (!opts.dryRun) fs.writeFileSync(filePath, cleanFile, { encoding: "utf-8" });
		if (!opts.summary) console.log(cleaned + filePath);
		cleanCount++;
	}
}

// Summarise
if (opts.summary || filePaths.length > 1) {
	console.log(
		chalk[cleanCount ? "green" : "blue"](
			`${chalk.bold(cleanCount)} file${cleanCount !== 1 ? "s" : ""} (${
				Math.round((1000 * cleanCount) / filePaths.length) / 10
			}%) ${opts.dryRun ? "would be" : cleanCount === 1 ? "was" : "were"} cleaned.`,
		),
	);
}
