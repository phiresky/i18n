import { MenuItem } from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/select";
import { action } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

@observer
export class CustomMultiSelect<T> extends React.Component<{
	items: T[];
	selectedItems: Set<T>;
	nameFn: (item: T) => string;
}> {
	override render() {
		const MultiSelectedT = MultiSelect.ofType<T>();
		const { items, nameFn, selectedItems } = this.props;
		return (
			<MultiSelectedT
				items={items}
				selectedItems={[...selectedItems]}
				itemPredicate={(query, item) =>
					!!nameFn(item).toLowerCase().includes(query.toLowerCase())
				}
				placeholder="Filter..."
				noResults={<MenuItem disabled={true} text="No results." />}
				resetOnSelect={true}
				itemRenderer={(item, { handleClick, modifiers, query }) => {
					if (!modifiers.matchesPredicate) {
						return null;
					}
					return (
						<MenuItem
							active={modifiers.active}
							icon={selectedItems.has(item) ? "tick" : "blank"}
							disabled={modifiers.disabled}
							key={nameFn(item)}
							onClick={handleClick}
							text={nameFn(item)}
							shouldDismissPopover={false}
						/>
					);
				}}
				tagRenderer={(e) => nameFn(e)}
				onItemSelect={(e) => {
					if (selectedItems.has(e)) {
						action("Remove item", () => {
							selectedItems.delete(e);
						})();
					} else {
						action("Add item", () => {
							selectedItems.add(e);
						})();
					}
				}}
				tagInputProps={{
					onRemove: (name) =>
						action("Remove item", () => {
							const item = [...selectedItems].find(
								(e) => nameFn(e) == name,
							);
							if (item) {
								selectedItems.delete(item);
							}
						})(),
				}}
			/>
		);
	}
}
