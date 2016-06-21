# hybrid-js

> JSBridge layer for hybrid framework.

基于Hybrid webapp架构的JSBridge层


### 重要说明

Hybrid框架分为两部分，本项目是JSBridge部分个人抽离公司业务之后拿出来的，另一部分是Native开发的H5容器。

很多朋友问到是否有客户端（即H5容器）的开源实现，这部分目前还在公司内部进行调试，暂不开源，而且因公司业务的关系只实现Android部分。

有需要的可以按照[api设计指南](./doc/design.md)来自己实现容器部分。


### 文档

- 基于HybridJS封装Android提供的API：参看[代码示例](./api/base.js)

- [api设计指南](./doc/design.md)

- [扩展HybridJS](./doc/extend-h5.md)

- [Hybrid APP架构设计思路](https://github.com/chemdemo/chemdemo.github.io/issues/12)


### 本地开发命令

预览示例：

``` bash
$ npm run start-dev
```

编译项目

``` bash
$ npm run build
```


### 引用

**注意：当且仅当已经实现了H5容器的前提下才能应用本项目js！**

- ES6方式：
```
import HybridJS from './dist/hybrid.js'
```

- (CommonJS)方式：
```
var HybridJS = require('./dist/hybrid.js');
```

- AMD(RequireJS)方式：
```
require(['./dist/hybrid.js'], function(HybridJS) {})
```

- script标签引用：
```
<script src="./dist/hybrid.js"></script>
<script>
    console.log(window.HybridJS)
</script>
```


### License

MIT.
