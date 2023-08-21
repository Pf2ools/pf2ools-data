// Constants
const FAMILY_NAMES = ['common', 'core', 'homebrew'];
const COMMON_DATA_TYPES = ['license', 'sourceGroup'];

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

// Define CLI
const program = new Command()
	.summary('Verify the filesystem of a Pf2ools Data repository')
	.argument('[path]', 'Data directory path', './data')
	.option('-a, --all', 'Verify entire filesystem (default: break at first verification failure)')
	.option('--datatypes <path>', 'Path to a list of datatypes', './indexes/datatypes.json')
	.parse(process.argv);

// Load and validate arguments
const opts = program.opts();
if (program.args.length > 1)
	program.error(chalk.red(`${'Too many arguments'} (maximum: 1)`), {
		exitCode: 1,
		code: 'invalid.args',
	});
const dataPath = path.join(...program.processedArgs[0].toString().split(path.sep));
let dataDir;
try {
	dataDir = fs.statSync(dataPath);
} catch {
	program.error(chalk.red(`"${dataPath}" not found`), {
		exitCode: 1,
		code: 'invalid.path',
	});
}
if (!dataDir.isDirectory())
	program.error(chalk.red(`"${dataPath}" is not a directory`), {
		exitCode: 1,
		code: 'invalid.path',
	});
if (!fs.statSync(opts.datatypes))
	program.error(chalk.red(`List of datatypes "${opts.datatypes}" not found`), {
		exitCode: 1,
		code: 'invalid.path',
	});
let datatypesFile;
try {
	datatypesFile = fs.statSync(opts.datatypes);
} catch {
	program.error(chalk.red(`"${opts.datatypes}" not found`), {
		exitCode: 1,
		code: 'invalid.path',
	});
}
if (!datatypesFile.isFile() || path.extname(opts.datatypes) !== '.json')
	program.error(chalk.red(`"${opts.datatypes}" is not a JSON file`), {
		exitCode: 1,
		code: 'invalid.path',
	});
const DATATYPES = JSON.parse(fs.readFileSync(opts.datatypes));
if (!Array.isArray(DATATYPES) || DATATYPES.some((e) => typeof e !== 'string'))
	program.error(chalk.red(`"${opts.datatypes}" is not an array of strings`), {
		exitCode: 1,
		code: 'invalid.datatypes',
	});

// ====== //

// Helpers
function logError(message) {
	if (!opts.all)
		program.error(chalk.red(message), {
			exitCode: 1,
			code: 'failed.verification',
		});
	console.error(chalk.red(message));
	errorStatus = true;
}
function sanitiseFilename(name, specifier) {
	const unsafeCharacters = new RegExp(/[<>:"/\\|?*]/gi);
	return name.replace(unsafeCharacters, '_') + (specifier ? ` - ${specifier.replace(unsafeCharacters, '_')}` : '');
}

// ====== //

// TESTS
let errorStatus = false;
for (const family of fs.readdirSync(dataPath)) {
	// START: Data directory
	//   - No non-directories
	//   - No directory named other than a family name
	const familyPath = path.join(dataPath, family);
	if (!fs.statSync(familyPath).isDirectory())
		logError(`The data directory can only contain family directories: ${chalk.bold(familyPath)}`);
	if (!FAMILY_NAMES.includes(family)) {
		logError(
			`Invalid family directory name: ${chalk.bold(familyPath)}\n\t${chalk.dim(
				`Expected: ${FAMILY_NAMES.join(', ')}`
			)}`
		);
	}
	// END: Data directory

	if (family === 'common') {
		for (const datatype of fs.readdirSync(familyPath)) {
			// START: `common` family directory
			//   - No non-directories
			//   - No directory not named as a common datatype
			const datatypePath = path.join(familyPath, datatype);
			if (!fs.statSync(datatypePath).isDirectory())
				logError(
					`The "common" family directory can only contain common datatype directories: ${chalk.bold(familyPath)}`
				);
			if (!COMMON_DATA_TYPES.includes(datatype))
				logError(
					`Invalid common datatype directory name: ${chalk.bold(datatypePath)}\n\t${chalk.dim(
						`Expected: ${COMMON_DATA_TYPES.join(', ')}`
					)}`
				);
			// END: `common` family directory

			for (const data of fs.readdirSync(datatypePath)) {
				// START: Common datatype directories
				//   - No non-files
				//   - No non-JSON files
				//   - File datatype must match its directory
				//   - File must be named as its `title.full` (sanitised)
				const dataPath = path.join(datatypePath, data);
				if (!fs.statSync(dataPath).isFile() || path.extname(dataPath) !== '.json')
					logError(`The "${datatypePath}" directory can only contain JSON files: ${chalk.bold(dataPath)}`);
				const content = JSON.parse(fs.readFileSync(dataPath));
				if (content.type !== datatype)
					logError(
						`File in incorrect datatype directory: ${chalk.bold(dataPath)}\n\t${chalk.dim(
							`Expected: ${familyPath}${path.sep}${content.type}${path.sep}${data}`
						)}`
					);
				const sanitisedFilename = sanitiseFilename(content.title.full);
				if (path.basename(data, '.json') !== sanitisedFilename)
					logError(
						`Filename does not match title: ${chalk.bold(dataPath)}\n\t${chalk.dim(
							`Expected: ${datatypePath}${path.sep}${sanitisedFilename}.json`
						)}`
					);
				// END: Common datatype directories
			}
		}
	} else {
		for (const source of fs.readdirSync(familyPath)) {
			// START: `core`/`homebrew` family directory
			//   - No non-directories
			const sourcePath = path.join(familyPath, source);
			if (!fs.statSync(sourcePath).isDirectory()) {
				logError(
					`The "${family}" family directory can only contain source directories: ${chalk.bold(sourcePath)}`
				);
				continue;
			}
			// END: `core`/`homebrew` family directory

			const sourceDirFiles = [];
			let sourceID;
			for (const datatype of fs.readdirSync(sourcePath)) {
				// START: Source directories (part 1)
				//   - No non-JSON files
				//   - File datatype not a source
				//   - File not named as its `title.full` (sanitised)
				//   - File not named identically to its source directory
				//   - No directory named other than a content datatype
				const datatypePath = path.join(sourcePath, datatype);
				const datatypeStat = fs.statSync(datatypePath);
				if (datatypeStat.isFile()) {
					if (path.extname(datatype) !== '.json') {
						logError(`Source directories can only contain one JSON source file: ${chalk.bold(datatypePath)}`);
					} else {
						const content = JSON.parse(fs.readFileSync(datatypePath));
						sourceDirFiles.push(datatypePath);
						sourceID = content.ID;
						if (content.type !== 'source')
							logError(`Source directories should contain only one source file: ${chalk.bold(datatypePath)}`);
						const sanitisedFilename = sanitiseFilename(content.title.full);
						if (path.basename(datatypePath, '.json') !== sanitisedFilename)
							logError(
								`Filename does not match title: ${chalk.bold(datatypePath)}\n\t${chalk.dim(
									`Expected: ${datatypePath}${path.sep}${sanitisedFilename}.json`
								)}`
							);
						if (source !== sanitisedFilename)
							logError(`Source directory does not match source title: ${chalk.bold(datatypePath)}`);
					}
				} else if (datatypeStat.isDirectory()) {
					if (!DATATYPES.includes(datatype))
						logError(`Datatype directory must be named with a valid datatype: ${chalk.bold(datatypePath)}`);
					// END: Source directories (part 1)

					for (const data of fs.readdirSync(datatypePath)) {
						// START: Content directories
						//   - No non-files
						//   - No non-JSON files
						//   - File datatype must match its directory
						//   - File sourceID must match its directory
						//   - File must be named as its `name.primary` plus specifier (if any; all sanitised)
						const dataPath = path.join(datatypePath, data);
						if (!fs.statSync(dataPath).isFile() || path.extname(dataPath) !== '.json')
							logError(`The "${datatypePath}" directory can only contain JSON files: ${chalk.bold(dataPath)}`);
						const content = JSON.parse(fs.readFileSync(dataPath));
						if (content.type !== datatype)
							logError(
								`File in incorrect datatype directory: ${chalk.bold(dataPath)}\n\t${chalk.dim(
									`Expected: ${sourcePath}${path.sep}${content.type}${path.sep}${data}`
								)}`
							);
						if (sourceID && content.source.ID !== sourceID)
							logError(
								`Content's source ID does not match parent source file: ${chalk.bold(dataPath)}\n\t${chalk.dim(
									`Expected source.ID: ${sourceID}`
								)}`
							);
						const sanitisedFilename = sanitiseFilename(content.name.primary, content.name.specifier);
						if (path.basename(data, '.json') !== sanitisedFilename)
							logError(
								`Filename does not match title: ${chalk.bold(dataPath)}\n\t${chalk.dim(
									`Expected: ${datatypePath}${path.sep}${sanitisedFilename}.json`
								)}`
							);
					}

					// START: Source directories (part 2)
					//   - No non-source, non-directory filesystem-objects
					//   - Must have a source file
					//   - No more than one source file
				} else {
					logError(`Unknown filesystem object: ${chalk.bold(datatypePath)}`);
				}
			}
			if (!sourceDirFiles.length) {
				logError(`Source directory lacks a source file: ${chalk.bold(sourcePath)}`);
			} else if (sourceDirFiles.length > 1) {
				logError(
					`Source directory should only have one source file:\n\t${chalk.bold(sourceDirFiles.join('\n\t'))}`
				);
			}
			// END: Source directories (part 2)
		}
	}
}

// Summary
if (!errorStatus) console.log(chalk.green('Data repository is valid'));
