import {
	NamedCmdParamOptions,
	PositionalCmdParam,
	NamedParamsToTypes,
	PositionalParamsToTypes,
} from "@hediet/cli";

export function cmdDef<
	TCmdData,
	TNamedParams extends Record<string, NamedCmdParamOptions> = {},
	TPositionalParams extends PositionalCmdParam[] = [],
>(def: CmdDef<TCmdData, TNamedParams, TPositionalParams>) {
	return def;
}

export interface CmdDef<
	TCmdData,
	TNamedParams extends Record<string, NamedCmdParamOptions> = {},
	TPositionalParams extends PositionalCmdParam[] = [],
> {
	name?: string | undefined;
	description?: string;
	positionalParams?: TPositionalParams;
	namedParams?: TNamedParams;

	getData: (
		args: NamedParamsToTypes<TNamedParams> &
			PositionalParamsToTypes<TPositionalParams>,
	) => TCmdData;
}
