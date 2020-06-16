import { observer } from "mobx-react";
import { InputGroup } from "@blueprintjs/core";
import { IRef } from "../embedded-editor/utils";
import * as React from "react";

export const InputGroupMobx = observer(
	(
		props: Omit<InputGroup["props"], "value"> & {
			value: IRef<string>;
		},
	) => (
		<InputGroup
			{...props}
			value={props.value.get()}
			onChange={
				((val) =>
					props.value.set(
						val.currentTarget.value,
					)) as React.FormEventHandler<HTMLInputElement>
			}
		/>
	),
);
