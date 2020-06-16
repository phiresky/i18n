export interface User {
	loginName: string;
	hashedPassword: string;
	passwordSalt: string;
	organizations: Organization[];
}

// at most 10 orgs per user
export interface Organization {
	users: User[];
}

// at most 50 projects per org
export interface Project {
	name: string;
	master: Version;
	defaultLanguageId: string;
}

// at most 1k versions per project
export interface Version {
	name: string;
	parentVersions: Version[];
	entries: TranslatableEntry[];
	languages: Language[]; // at most 100 languages
}

export interface Language {
	id: string;
	entries: TranslationEntry[];
}

// at most 10k translatable entries per version
export interface TranslatableEntry {
	id: string;
	codeSource: unknown;
	context: string;
}

export interface TranslationEntry {
	id: string;
	version: number;
	groupId: string;
	translation: string;
	suggestedTranslation: string;
}
