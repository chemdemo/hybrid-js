## UA

为了便于H5的调试，SDK统一在webview的UA里边追加一些标识：

- 增加“FlymeOS”标识，有此标志的会认为H5运行在app里边，否则是浏览器环境

- 增加app名称和版本，用于区分是哪个app，例如音乐盒子，增加“MusicBox/1”标识

示例：
``` java
// java code
String ua = webview.getSettings().getUserAgentString();

ua += " FlymeOS MusicBox/1";

webview.getSettings().setUserAgentString(ua);
```

-----
## 通讯协议

### H5调用Native

格式：`flyme://[namespace]/[method]?value=[String value]`

示例：H5调用音乐播放

``` js
// js code
var url = 'flyme://music/play?'
var value = {type: 1, name: 'xx', id: 222, position: 0}

url += encodeURIComponent('value=' + JSON.stringify(value))
openUrl(url)

print(url) // flyme://music/play?value%3D%7B%22id%22%3A%22222%22%2C%22type%22%3A%221%22%2C%22name%22%3A%22xx%22%2C%22position%22%3A%220%22%7D
print(decodeURIComponent(url)) // flyme://music/play?value={"id":"222","type":"1","name":"xx","position":"0"}
```

### Native调用H5

格式：`webview.loadUrl("javascript:FlymeJS.invokeWeb('[api]', '{value=[String value]}')")`

`FlymeJS.invokeWeb()`函数作为Native调用H5的统一唯一入口，H5页面也只会唯一暴露`FlymeJS`对象。

示例：Native设置H5页面标题

H5必须先定义好如何响应“Native设置H5页面标题”这一行为，即开放一个api供Native调用，假设api叫做`dom.setTitle`：

``` js
// js code
FlymeJS.assign('dom.setTitle', function(title) {
    document.title = title
})
```

然后Native调用即可成功：

``` java
// java code
webview.loadUrl("javascript: FlymeJS.invokeWeb('dom.setTitle', {value: 'foo'}")
```


### H5调用Native，带回调

格式：`flyme://[namespace]/[method]?value=[String value]&req_sn=[String req_sn]`

这里不同的是参数多了额外的一项`req_sn`，req_sn的值由H5生成及维护，设计sn的目的是为了区分同一个接口的多次调用，即非幂等接口的调用

示例：H5获取app的“使用移动网络时提醒”项设置

``` js
var url = 'flyme://sdk/get_status?'
var value = 'notifyOnNotWifi'
var req_sn = 123

url += encodeURIComponent('value=' + value + '&req_sn=' + req_sn)
openUrl(url)
```

value这里表示该接口需要的参数，如果是多个参数需要将其先stringify之后再传递：

``` js
var value = {key1: 'xx', key2: 'yy'}
...

url += encodeURIComponent('value=' + JSON.stringify(value) + '&req_sn=' + req_sn)
```

Native再回调：

``` java
webview.loadUrl("javascript: FlymeJS.invokeWeb('sdk.get_status', '{value: \"true\", res_sn: 123}')")
```

value表示Native的处理结果，数据结构可能是简单数据类型也可能是Object或Array


### Native调用H5，带回调

格式：

`webview.loadUrl("javascript:FlymeJS.invokeWeb('[api]', '{req_sn: [String req_sn], value=[String value]}')")`

示例：Native获取页面某元素文本

``` java
// java code
webview.loadUrl("javascript:FlymeJS.invokeWeb('dom.getNodeText', '{value: \"#box\", req_sn: 123}')")
```

``` js
// js code
FlymeJS.assign('dom.getNodeText', function(id) {
    return document.getElementById(id).innerHTML;
});
```

js返回值之后Native会收到类似的请求：

``` js
flyme://dom/getNodeText?res_sn=123&value=text
```


-----
## Native公共api

公共api即一些通用接口的封装（内置）。


### 页面跳转（新开窗口）

``` js
flyme://sdk/jump?value={url: [String url], type: [Number type]}
```

type值：

- 0：表示H5页面内跳转（默认跳转方式, 和a标签跳转一样）
- 1：表示Native跳转方式，Native新起页面来跳转, 带过渡动画
- 2：跳转Native页面，页面的url需要客户端同学给出
- 3：启动其他app，url是其他app的id


### 页面回退

``` js
flyme://sdk/back?value=[Number value]
```

value值:

- 0：表示什么都不处理， 通知客户端h5消耗了返回事件
- 1：表示客户端需处理返回
- 2：表示客户端需直接退出页面


### 设置Native一些状态

``` js
flyme://sdk/set_status?value={key: [String key], value: [String value]}
```

例: 设置返回事件拦截

key="interceptOnBack"，value="0"表示不拦截，value="1"表示拦截


### 获取Native一些状态值

``` js
flyme://app/get_status?value=[String key]&req_sn=[String sn]
```

例: 获取网络状态

key="network"


-----
## 事件

事件也是在通讯协议的基础上做的扩展，为了方便应用层更容易理解api。


### 一般事件

事件的原理，其实就是java的反向通知(notify)：

``` java
webview.loadUrl('javascript:FlymeJS.invokeWeb("sdk.notify", "{value={event: [String name], data: [String data]}}")');
```

如果H5事先监听了此事件，则在Native通知时会处理此事件，从而“消费”此事件。

H5监听事件：

``` js
// js code
FlymeJS.on('event', function(data) {});
```

理论上，事件名是Native和H5应用层互相约定的，目前约定好的事件名只有下面的[mback](#mback-event)，SDK只充当传递消息的作用。

自定义事件示例：音乐app通知H5同步播放状态

``` java
// java code
webview.loadUrl('javascript: FlymeJS.invokeWeb("sdk.notify", "{value={event: 'music.stateChange', data: 'xxx'}}")');
```

``` js
// js code
FlymeJS.on('music.stateChange', function(data) {
    console.log(data); // xxx
})
```

### mback事件<a id="mback-event"> </a>

提供接口给H5捕获mback事件。

H5通知Native页面需要监听mback：

``` js
flyme://sdk/set_status?key=interceptOnBack&value=1
```

H5注册mback事件handler：

``` js
// js code
FlymeJS.on('mback', function() {
    // ...
    FlymeJS.app.back(1);
});
```

用户触发mback时Native通知H5：

``` java
// java code
webview.loadUrl('javascript:FlymeJS.invokeWeb("sdk.notify", "{value={event: 'mback'}}")');
```
