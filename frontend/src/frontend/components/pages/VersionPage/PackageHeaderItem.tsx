import { observer } from "mobx-react";
import * as React from "react";
@observer
export class PackageHeaderItem extends React.Component<{
	pkg: { packageId: string };
}> {
	override render() {
		const { pkg } = this.props;
		return (
			<h1
				className="bp5-heading"
				style={{ padding: 0, margin: 0, marginTop: 16 }}
			>
				{pkg.packageId}
			</h1>
		);
	}
}
