const nodeExternals = require('webpack-node-externals');
const postCommand = {
    apply: compiler => {
        compiler.hooks.done.tap('MyPlugin', stats => {
            setTimeout(() => {
                console.log('all done.');
            });
        });
    }
}

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    target: 'node',
    output: {
        path: `${__dirname}/dist`,
        filename: 'index.js'
    },
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader'
            }
        ]
    },
    plugins: [
        postCommand
    ],
    resolve: {
        extensions: ['.ts', '.js']
    }
}
