import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import * as React from "react";

export class SimpleSelect<T> extends React.Component<{
	items: T[];
	contentProvider: (item: T) => { text: string; label?: string };
	onSelect: (item: T) => void;
	selectedItem: T | undefined;
}> {
	override render() {
		const SelectT = Select.ofType<T>();
		const { items, contentProvider, selectedItem } = this.props;
		if (items.length === 0) {
			return (
				<Button
					disabled={true}
					fill
					alignText="left"
					text={"No Items"}
					rightIcon="double-caret-vertical"
				/>
			);
		}
		return (
			<SelectT
				popoverProps={{
					targetProps: { style: { width: "100%" } },
					portalClassName: "i18n-widget",
				}}
				inputProps={{ style: { width: "100%" } }}
				items={items}
				itemPredicate={(query, item) => {
					const { label, text } = contentProvider(item);
					return (
						(label &&
							label
								.toLocaleLowerCase()
								.indexOf(query.toLocaleLowerCase()) !== -1) ||
						text
							.toLocaleLowerCase()
							.indexOf(query.toLocaleLowerCase()) !== -1
					);
				}}
				itemRenderer={(item, { handleClick, modifiers, index }) => (
					<MenuItem
						active={modifiers.active}
						disabled={modifiers.disabled}
						key={index}
						onClick={handleClick}
						label={contentProvider(item).label}
						text={contentProvider(item).text}
					/>
				)}
				onItemSelect={(item) => {
					this.props.onSelect(item);
				}}
				activeItem={selectedItem}
			>
				<Button
					fill
					alignText="left"
					text={
						selectedItem
							? contentProvider(selectedItem).text
							: "Select Item..."
					}
					rightIcon="double-caret-vertical"
				/>
			</SelectT>
		);
	}
}
