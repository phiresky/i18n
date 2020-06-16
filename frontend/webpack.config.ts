import { CleanWebpackPlugin } from "clean-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import * as webpack from "webpack";

const r = (file: string) => path.resolve(__dirname, file);

module.exports = {
	entry: {
		frontend: r("src/frontend/index.tsx"),
		["embedded-editor"]: r("src/embedded-editor/index.tsx"),
	},
	output: {
		path: r("dist/frontend"),
		filename: "[name]-[hash].js",
		chunkFilename: "[name]-[hash].js",
		publicPath: "/",

		devtoolModuleFilenameTemplate: (info: any) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			let result = info.absoluteResourcePath.replace(/\\/g, "/");
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			if (!result.startsWith("file:")) {
				// Some paths already start with the file scheme.
				// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
				result = "file:///" + result;
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return result;
		},
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
	},
	optimization: {
		minimize: false,
	},
	devtool: "source-map",
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [{ loader: "style-loader" }, { loader: "css-loader" }],
			},
			{
				test: /\.scss$/,
				use: [
					{ loader: "style-loader" },
					{ loader: "css-loader" },
					{ loader: "sass-loader" },
				],
			},
			{
				test: /\.(jpe?g|png|gif|eot|ttf|svg|woff|woff2|md)$/i,
				loader: "file-loader",
			},
			{
				test: /\.tsx?$/,
				loader: "ts-loader",
				options: { transpileOnly: true },
			},
		],
	},
	devServer: {
		liveReload: false,
		hot: false,
		client: false,
		historyApiFallback: true,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods":
				"GET, POST, PUT, DELETE, PATCH, OPTIONS",
			"Access-Control-Allow-Headers":
				"X-Requested-With, content-type, Authorization",
		},
	},
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			excludeChunks: ["embedded-editor"],
			templateContent: `
<!DOCTYPE html>
<html>
	<head>
	<meta charset="utf-8">
	<title>Translation Editor</title>
	</head>
	<body>
	</body>
</html>`,
		}),
		new HtmlWebpackPlugin({
			filename: "embedded.html",
			excludeChunks: ["frontend"],
			templateContent: `
<!DOCTYPE html>
<html>
	<head>
	<meta charset="utf-8">
	<title>Embedded Translation Editor Test</title>
	</head>
	<body>
	</body>
</html>`,
		}),
		new ForkTsCheckerWebpackPlugin(),
	],
} as webpack.Configuration;
