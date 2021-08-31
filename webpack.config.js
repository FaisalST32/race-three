const path = require('path');

module.exports = {
	entry: './src/app.ts',
	mode: 'development',
	devtool: 'eval-source-map',
	devServer: {
		contentBase: './dist',
		hot: true,
		open: true,
		port: 6060,
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
	},
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, './dist'),
	},
};
