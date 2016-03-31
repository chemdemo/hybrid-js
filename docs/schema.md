## UA

为了便于H5的调试，SDK统一在webview的UA里边追加一些标识：

- 增加公司标识，有此标志的会认为H5运行在app里边，否则是浏览器环境，例如“FlymeOS”

- 增加app名称和版本，用于区分是哪个app，例如音乐APP，增加“Music/1”标识

示例：
``` java
// java code
String ua = webview.getSettings().getUserAgentString();

ua += " FlymeOS/Music/1";

webview.getSettings().setUserAgentString(ua);
```

-----
## 通讯协议

### H5调用Native

格式：`schema://[namespace]/[method]?[...arguments]`

示例：H5调用音乐播放

``` js
// js code
var url = 'hybrid://music/play?'
var params = {type: 1, name: 'xx', id: 222, position: 0}

url += encodeURIComponent(serialize(params))

print(url) // hybrid://music/play?type%3D1%26name%3Dxx%26id%3D222%26position%3D0
print(decodeURIComponent(url)) // hybrid://music/play?type=1&name=xx&id=222&position=0

function serialize(obj) {
    var r = [];

    for(var k in obj) {
        var v = obj[k];

        // 如果值是对象或者数组，会先将其序列化成字符串
        if(typeof v == 'object') v = JSON.stringify(v)

        r.push(k + '=' + v);
    }

    return r.join('&');
}
```

### Native调用H5

格式：`webview.loadUrl("javascript: HybridJS.invokeWeb('[api]', '[...params]')")`

`HybridJS.invokeWeb()`函数作为Native调用H5的统一唯一入口，H5页面也只会唯一暴露`HybridJS`对象。

示例：Native设置H5页面标题

``` java
// java code
webview.loadUrl("javascript: HybridJS.invokeWeb('dom.setTitle', 'foo'")
```

``` js
// js code
// H5注册`dom.setTitle`的处理函数，即H5开饭接口给Native
HybridJS.assign('dom.setTitle', function(title) {
    document.title = title;
});
```

【注】这里的`api`参数，由H5提供给Native，理论上是可以是任意值，除了`app.callback`和`app.notify`之外，这两个是和Native做了约定（Native SDK内置），前者表示Native回调H5（参见下面“H5调用Native，带回调”部分），后者表示Native的事件通知H5（参见下面“事件”部分）。


### H5调用Native，带回调

格式：`hybrid://[namespace]/[method]?[...arguments]`

示例：H5获取app的“使用移动网络时提醒”项设置

``` js
var url = 'hybrid://app/get_status?'
var params = {key: 'notifyOnNotWifi', req_sn: 123}

url += encodeURIComponent(serialize(params))
```

这里唯一不同的是参数多了额外的一项`req_sn`，req_sn的值由H5生成及维护

app再回调：

``` java
webview.loadUrl("javascript: HybridJS.invokeWeb('app.callback', '{value: \"true\", res_sn: 123}')")
```


### Native调用H5，带回调

格式：`webview.loadUrl("javascript: HybridJS.invokeWeb('[api]', '{req_sn: 234, …}')")`

示例：Native获取页面某元素文本

``` java
// java code
webview.loadUrl("javascript:HybridJS.invokeWeb('dom.getNodeText', '{id: \"box\", req_sn: 123}')")
```

``` js
// js code
HybridJS.assign('dom.getNodeText', function(options) {
    return document.getElementById('options.id').innerHTML;
});
```

js返回值之后Native会收到类似的请求：

``` js
hybrid://web/callback?res_sn=123&value=xxxx
```

这里`web/callback`约定表示H5回调Native，res_sn用于Native查找对应的是哪个接口调用。


-----
## Native公共api

公共api即一些通用接口的封装（内置）。

### 页面跳转（新开窗口）

``` js
hybrid://app/jump?url=xxx&type=xxx
```

type值：

- 0：表示页面内跳转（默认跳转方式, 直接跳转也可以）
- 1：表示native跳转方式， native新起页面来跳转, 带过渡动画

### 页面回退

``` js
hybrid://app/back?value=xxx
```

value值:

- 0：表示什么都不处理， 通知客户端h5消耗了返回事件
- 1：表示客户端需处理返回
- 2：表示客户端需直接退出页面

### 设置Native一些状态

``` js
hybrid://app/set_status?key=xxx&value=xxx
```

例: 设置返回事件拦截

key="interceptOnBack"，value="0"表示不拦截，value="1"表示拦截

### 获取Native一些状态值

``` js
hybrid://app/get_status?key=xxx&req_sn=xxx
```

例: 获取网络状态

key="network"


-----
## 事件

事件也是在通讯协议的基础上做的扩展，为了方便应用层更容易理解api。

### 一般事件

事件的原理，其实就是java的反向通知：

``` java
webview.loadUrl('javascript:HybridJS.invokeWeb("app.notify", "{event: [event name], data: [data]}")');
```

如果H5事先监听了此事件，则在Native通知时会处理此事件，从而“消费”此事件。

H5监听事件：

``` js
// js code
HybridJS.on('event', function(data) {});
```

理论上，事件名是Native和H5应用层互相约定的，目前约定好的事件名只有下面的`app.mback`，SDK只实现通知H5这一行为。

示例：音乐app通知H5同步播放状态

``` java
// java code
webview.loadUrl('javascript: HybridJS.invokeWeb("app.notify", "{event: 'music.stateChange', data: xxx}")');
```

``` js
// js code
HybridJS.on('music.stateChange', function(data) {...});
```

### mback事件

提供接口给H5捕获mback事件。

H5通知Native页面需要监听mback：

``` js
hybrid://app/set_status?key=interceptOnBack&value=1
```

H5注册mback事件handler：

``` js
// js code
HybridJS.on('mback', function() {
    // ...
    HybridJS.app.back(1);
});
```

用户触发mback时Native通知H5：

``` java
// java code
webview.loadUrl('javascript:HybridJS.invokeWeb("app.notify", "{event: 'app.mback'}")');
```
