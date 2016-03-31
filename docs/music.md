# 音乐app特有接口

## 方法

### music.play

说明：播放音乐

参数：
- `id`: 歌曲id
- `type`：歌曲类型（电台 1，专辑 2，排行榜 3，艺人 6，魅族每日推荐 7，歌单 8，离线电台 1000，单曲 1003）
- `name`：歌曲名
- `position`：从哪里播放, 默认是0，从头播放

示例：

``` js
HybridJS.music.play(12121, 1003, '平凡之路')
```


## 事件

### music.stateChange

说明：app播放歌曲时状态变更反向通知H5

示例：

``` js
HybridJS.on('music.stateChange', function(data) {
    console.log(data); // {playing: [true/false], songId: xxx}
})
```
