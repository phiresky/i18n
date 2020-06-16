import { contract, requestType, semanticJson as s } from "@hediet/json-rpc";
import { sOrgOverview, sVersionInfo, sVersionRef } from "./types";

export const mainContract = contract({
	name: "service",
	client: {},
	server: {
		/* def */ ping: requestType({}),
		/* def */ getOrganizations: requestType({
			result: s.sObject({
				orgs: s.sArrayOf(sOrgOverview),
			}),
		}),
		/* def */ createOrganization: requestType({
			params: s.sObject({
				orgId: s.sString(),
				admins: s.sArrayOf(s.sString()),
			}),
		}),
		/* def */ deleteOrganization: requestType({
			params: s.sObject({
				orgId: s.sString(),
			}),
		}),
		/* def */ getOrgMemberships: requestType({
			params: s.sObject({
				orgId: s.sString(),
			}),
			result: s.sObject({
				members: s.sArrayOf(
					s.sObject({
						userId: s.sNumber(),
						username: s.sString(),
						isAdmin: s.sBoolean(),
					}),
				),
			}),
		}),
		/* def */ getProjectInfo: requestType({
			params: s.sObject({
				orgId: s.sString(),
				projectId: s.sString(),
			}),
			result: s.sObject({
				isAdmin: s.sBoolean(),
				canDeleteVersions: s.sBoolean(),
				canForkVersion: s.sBoolean(),
				canConfigureVersion: s.sBoolean(),
			}),
		}),
		/* def */ createProject: requestType({
			params: s.sObject({
				orgId: s.sString(),
				projectId: s.sString(),
			}),
			result: s.sObject({}),
		}),
		/* def */ updateOrgMembership: requestType({
			params: s.sObject({
				orgId: s.sString(),
				user: s.sUnion([
					s.sObject({ username: s.sString() }),
					s.sObject({ userId: s.sNumber() }),
				]),
				state: s.sUnion([
					s.sLiteral("none"),
					s.sLiteral("member"),
					s.sLiteral("admin"),
				]),
			}),
		}),
		/* def */ createVersion: requestType({
			params: s.sObject({
				orgId: s.sString(),
				projectId: s.sString(),
				name: s.sString(),
				parents: s.sArrayOf(s.sObject({ versionId: s.sString() })),
			}),
			result: s.sObject({
				version: sVersionInfo,
			}),
		}),
		/* def */ deleteVersion: requestType({
			params: s.sObject({
				version: sVersionRef,
			}),
		}),
	},
});

/*
export const liveEditContract = contract({
	name: "liveEdit",
	client: {
		onTranslationChange: notificationType({
			params: s.sObject({
				version: sVersionRef,
				changedTranslations: sTranslationsForLanguageCode,
			}),
		}),
	},
	server: {
		subscribe: requestType({
			params: s.sObject({
				version: sVersionRef,
				languageCode: s.sString(),
			}),
		}),
	},
});
*/
