/**
 * App-level logger for @music-api/netease.
 * Verbatim port of api-enhanced/util/logger.js (ANSI colors preserved).
 */
// biome-ignore lint/suspicious/noExplicitAny: logger accepts anything
type LogArgs = any[];

const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	black: "\x1b[30m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
	bgRed: "\x1b[41m",
	bgGreen: "\x1b[42m",
	bgYellow: "\x1b[43m",
};

export const logger = {
	debug: (msg: unknown, ...args: LogArgs): void => {
		console.info(`${colors.cyan}[DEBUG]${colors.reset}`, msg, ...args);
	},
	info: (msg: unknown, ...args: LogArgs): void => {
		console.info(`${colors.green}[INFO]${colors.reset}`, msg, ...args);
	},
	warn: (msg: unknown, ...args: LogArgs): void => {
		console.info(`${colors.yellow}[WARN]${colors.reset}`, msg, ...args);
	},
	error: (msg: unknown, ...args: LogArgs): void => {
		console.error(`${colors.red}[ERROR]${colors.reset}`, msg, ...args);
	},
	success: (msg: unknown, ...args: LogArgs): void => {
		console.log(
			`${colors.bright}${colors.green}[SUCCESS]${colors.reset}`,
			msg,
			...args,
		);
	},
};
