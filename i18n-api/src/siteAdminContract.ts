import { contract, requestType, semanticJson as s } from "@hediet/json-rpc";

export const siteAdminContract = contract({
	name: "auth",
	client: {},
	server: {
		/* def */ listUsers: requestType({
			result: s.sArrayOf(
				s.sObject({
					id: s.sNumber(),
					username: s.sString(),
					email: s.sString(),
					isSiteAdmin: s.sBoolean(),
				}),
			),
		}),
		/* def */ createUser: requestType({
			params: s.sObject({
				username: s.sString(),
				email: s.sString(),
				isSiteAdmin: s.sBoolean(),
				password: s.sString(),
			}),
		}),
		/* def */ updateUser: requestType({
			params: s.sObject({
				userId: s.sNumber(),
				password: s.prop(s.sString(), {
					optional: true,
				}),
				isSiteAdmin: s.prop(s.sBoolean(), {
					optional: true,
				}),
			}),
		}),
		/* def */ deleteUser: requestType({
			params: s.sObject({
				userId: s.sNumber(),
			}),
		}),
	},
});
