## HybridJS扩展

利用`HybridJS.wrapAPI()`对Native提供的api做一层封装，从而达到扩展HybridJS的目的

- wrapAPI方法可以将形如`[classname]/[method]`这样的Native api封装成`HybridJS.[namespace].[method]()`这样的调用方式，更加直观

``` js
HybridJS.wrapAPI('music.play', (id, type, name, position = 0) => {
    HybridJS.invokeApp('com.mycompany.music/play', {id, type, name, position})
})

// call:
HybridJS.music.play(id, type, name, position)
```

- 可以对Native API进行浏览器兼容，防止在浏览器里边报错

``` js
HybridJS.wrapAPI('view.back', (value = 1) => {
    if(HybridJS.isInApp) HybridJS.invokeApp('com.mycompany.hybridSDK.handler.UrlHandler/back', {value})
    else window.history.back()
})
```

- 自行打包扩展过的HybridJS

如果业务层是多人维护的并且有较多的HybridJS接口扩展，可以自行打包，方便代码在多人之间共享。


## 自行打包HybridJS module

- clone hybridjs 源码

``` bash
$ git clone https://github.com/chemdemo/hybrid-js.git
```

- 添加业务代码

假设有一个音乐应用，在`api/`目录下添加`music.js`，然后加入代码示例（支持ES6语法）：

``` js
import HybridJS from './base'

HybridJS.wrapAPI('music.play', (id, type, name, position = 0) => {
    HybridJS.invokeApp('com.mycompany.music/play', {id, type, name, position})
})

module.exports = HybridJS
```

- 打包

``` bash
$ npm install && npm run build
```

在dist目录下回生成两个业务代码文件，一个是压缩版（hybridjs-music.min.js）一个是未压缩版（hybridjs-music.js），根据需要用这两个文件替换（生成的业务代码已经包含了hybridjs.js所有的功能）`hybridjs.js`即可。
