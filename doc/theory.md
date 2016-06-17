## 通讯基础（以Android为例）

基于Webview拦截HTTP URL

- Android调用H5：通过webview类的`loadUrl`方法可以直接执行js代码，类似浏览器地址栏输入一段js一样的效果

``` java
webview.loadUrl("javascript: alert('hello world')");
```

- H5调用Android：webview可以拦截H5发起的任意url请求，webview通过约定的规则对拦截到的url进行处理（消费），即可实现H5调用Android

``` java
WebviewClient.shouldOverloadUrl
```

## 协议

为了和HTTP区分开，使用私有协议

私有协议格式

异步

事件（反向push）

## UA
