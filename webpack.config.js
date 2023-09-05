const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'src/login/index.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: './login/index.js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'public/login.html'),    // 模板文件
            filename: path.resolve(__dirname, 'dist/login/index.html')  // 输出文件
        }),
        new MiniCssExtractPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.css$/i,
                // use: ["style-loader", "css-loader"],     // CSS 和 JS 一起打包
                use: [MiniCssExtractPlugin.loader, "css-loader"]   // CSS 单独打包
            },
            {
                test: /\.less$/i,
                use: [
                    // compiles Less to CSS
                    // 'style-loader',
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'less-loader',
                ],
            },
            {
                // 打包哪些文件
                test: /\.(png|jpg|gif)$/i,
                // 资源模块打包类型
                // asset表示：根据资源大小由 Webpack 自动进行判断打包方式
                //    - 如果资源大小大于8KB，那么发送一个单独的文件并导出URL地址，参考<https://raw.githubusercontent.com/michik0/notes-image/master/20230905113143.png>
                //    - 如果资源大小小于8KB：导出一个data URI(base64字符串)，参考<https://raw.githubusercontent.com/michik0/notes-image/master/20230905113349.png>
                type: 'asset',
                generator: {
                    // 导出位置
                    // 占位符 [hash] 对模块内容做算法计算，得到映射的数字字母组合的字符串
                    // 占位符 [ext] 使用当前模块原本的占位符，例如：，png/jpg等字符串
                    // 占位符 [quey] 保留引入文件时代码中查询参数（只有URL下生效）
                    filename: 'assets/[hash][ext][query]'
                }
            }
        ]
    },
    optimization: {
        minimizer: [
            // 在 webpack@5 中，你可以使用 `...` 语法来扩展现有的 minimizer（即 `terser-webpack-plugin`），将下一行取消注释
            `...`,
            new CssMinimizerPlugin()
        ]
    }
};