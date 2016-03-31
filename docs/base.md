# 公共接口

## 属性

- HybridJS.isInApp 区分浏览器环境还是app环境

- HybridJS.device 获取设备名称

- HybridJS.debug 是否开启调试模式

- HybridJS.appName app名称，如`music-box`表示音乐盒子

- HybridJS.appVersion apk版本


## 方法

### app.setStatus

说明：设置/重置app状态值

参数：
- `key`: 状态key
- `value`：状态值

示例：

``` js
HybridJS.app.setStatus('foo', 'bar')
```

### app.getStatus

说明：获取app状态值

参数：
- `key`: 要获取的状态值名称，目前有，网络状态`network`，手机标识`imei`，帐户标识`userId`，包名`package`

示例：

``` js
HybridJS.app.getStatus('network', function(value) {
    console.log(value); // 3G
});
```

### app.open

说明：打开新页面

参数：
- `url`: 新页面地址，必须是绝对路径
- `type`：打开类型，`0`表示页面内打开，`1`表示native新开窗口打开，带转场动画

示例：

``` js
$('button').on('click', function() {
    HybridJS.app.open('http://music.box.meizu.com/detail.html', 1);
})
```

### app.back

说明：H5回退

参数：
- `type`: `0`表示什么都不处理，app什么都不做，`1`表示将mback行为交由客户端来处理，`2`则直接关闭当前H5页面。默认是1

示例：

``` js
HybridJS.app.back(1); // 回退到前一个页面
```

### app.listenMBack

说明：通知app，H5需要对mback键进行拦截处理

参数：无

示例：

``` js
HybridJS.app.listenMBack();
```

### app.cancelListenMBack

说明：通知app，H5不需要对mback键进行拦截处理，用于事先已经通知app监听mback的情况

参数：无

示例：

``` js
HybridJS.app.cancelListenMBack();
```

## 事件

### mback

说明：H5监听mback事件，

> 注意，mback要生效，前提是必须事先已经通知app对mback做监听（即调用过listenMBack），否则该事件无效

示例：

``` js
HybridJS.app.listenMBack();

HybridJS.on('mback', function() {
    // 只关闭浮层不退出页面
    if(!$('#popup').isHide) {
        $('#popup').hide();
        HybridJS.app.back(0);
    } else {
        // 自然回退
        HybridJS.app.back(1);
    }
})
```

## H5开放接口给app调用

注意：可根据业务需要自行开放，以下只是示例

示例（app不需要返回值）：app设置页面title

``` js
HybridJS.assign('web.setTitle', function setTitle(title) {
    document.title = title;
});
```

客户端调用：

``` java
webview.loadUrl('javascript:HybridJS.invokeWeb("setTitle", "xxx")')
```


示例（app需要返回值）：app需要获取dom元素的文本

``` js
HybridJS.assign('web.getText', function getDOMText(options) {
    return document.querySelector(options.id).innerHTML;
});
```

客户端调用：

``` java
webview.loadUrl('javascript:HybridJS.invokeWeb("getText", {"id": "#box", "res_sn": 123})')
```
