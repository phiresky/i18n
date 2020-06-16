import {
	contract,
	requestType,
	semanticJson as s,
	ErrorCode,
} from "@hediet/json-rpc";

export const authContract = contract({
	name: "auth",
	client: {},
	server: {
		/* def */ login: requestType({
			params: s.sObject({
				usernameOrEmail: s.sString(),
				password: s.sString(),
			}),
			result: s.sObject({
				authToken: s.sString(),
			}),
		}),
		/* def */ changePassword: requestType({
			params: s.sObject({
				oldPassword: s.sString(),
				newPassword: s.sString(),
			}),
		}),
		/* def */ authenticate: requestType({
			params: s.sObject({
				authToken: s.sString(),
			}),
		}),
		/* def */ destroySession: requestType({}),

		/* def */ getCurrentUserInformation: requestType({
			result: s.sObject({
				email: s.sString(),
				username: s.sString(),
				isSiteAdmin: s.sBoolean(),
			}),
		}),
	},
});

export const unauthorizedErrorCode = ErrorCode.applicationError(401);
