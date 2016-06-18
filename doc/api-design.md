## 通讯基础（以Android为例）

- Android调用H5

    ``` java
    webview.loadUrl("javascript: alert('hello world')");
    ```

    通过Webview类的`loadUrl`方法可以直接执行js代码，从而达到Android调用H5

- H5调用Android

    ``` java
    WebviewClient.shouldOverrideUrlLoading(WebView view, String url)
    ```

    基于Webview对H5发起的HTTP URL进行拦截，双方约定特定的URL的格式以及Android定制响应以实现H5调用Android，这也时离线容器的原理


## 通讯的实现

理论上，Webview是可以拦截一切H5发起的请求的，无论是标准协议（如`http://`、`https://`等）还是私有协议（如`myschema://`）。为了不和标准协议相冲突，我们采用私有协议的形式。

两个好处：

1. 简化Native逻辑复杂度（混淆使用标准协议需要Native拦截到URL的时候做过滤）
2. 为APP外部打开APP内部界面提供接口（如“浏览器页面内启动原生APP界面”这类需求就是基于这个原理实现的）


### H5调用Android

H5请求格式：

``` js
schema://classname/method?value={}
```

`schema`即自行约定的私有协议，一般是公司名或者应用名

`classname/method`这两个一起，指定API名称，classname可以是Android的类名，让然也可以只是一个普通字符串，只要Native方便识别即可

`value`是与method对应的参数

请求示例：

``` js
// H5直接指定包名和方法名，这样更容易扩展
iframe.src = `myschema://com.mycompany.hybrid.InteractHandler/toast?value={msg: 'hello world'}`

// 用约定的字符串也可以，Android拿到之后自己再做一次map
iframe.src = `myschema://interact/toast?value={msg: 'hello world'}`
```

### Android响应H5




### 异步接口

上面的例子是简单的SET类，不需要返回值。对于需要Android返回值给H5的接口，需要做一些额外的事情。

首先，Android在处理完逻辑之后返回值给H5时，需要知道这是哪一个URL或同URL的不同次请求，所以在请求的URL上再挂一个参数`sn`，每次请求都不同且唯一，sn由调用方生成并维护。这其实在前端已经不是什么新鲜的东西了，JSONP其实就是这个原理。

其次，由于js是单线程，所有与IO相关的接口一般都要做成异步的方式，所以当Android回调H5时需要通过某个标识找到回调对应的handle，本项目中这个标识就是sn，sn在H5内部是和每次请求的callback形成一个map映射表。

代码示例：

``` js
var map = {}
var callback = function(r) {console.log(r)}
var sn = callbackSign(callback) // callbackSign是某种签名算法

map[sn] = callback

iframe.src = `myschema://data/get?value={key: 'hello'}&sn=${sn}`
```



### 事件（反向push）


## UA
