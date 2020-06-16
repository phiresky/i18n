/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const Module = require("module"); // eslint-disable-line
const req = Module._resolveFilename;
Module._resolveFilename = function (...args: any[]) {
	const result = req.apply(this, args);
	return result.toLowerCase();
};

import "./index";
