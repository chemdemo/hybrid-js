/*
* @Author: dmyang
* @Date:   2015-11-10 10:21:22
* @Last Modified by:   dmyang
* @Last Modified time: 2016-07-29 16:44:26
* @Description: Hybrid core code
*/

'use strict'

const WIN = window
const UA = navigator.userAgent
const SLICE = Array.prototype.slice
const IS_ARR = Array.isArray
const EC = WIN.encodeURIComponent
// 判断是否在iframe里边加载此js
const IS_IN_IFRAME = WIN.top !== WIN.self

const OS_NAME = 'HybridApp' // 推荐替换成公司标识，如淘宝“TaobaoCN”
const API_ROOT = 'HybridJS'
const SCHEMA = 'hybrid' // 私有协议，建议替换成公司私有协议，如腾讯“tencent”
const WEB_CB_SN_PREFIX = '__t_'
const REQ_SN_KEY = 'req_sn'
const RES_SN_KEY = 'res_sn'

const CALLBACKS = {}
const HANDLERS = {}

const Hybrid = WIN[API_ROOT] = {}
// ${OS_NAME}/o2o/1
let m = UA.match(new RegExp(OS_NAME + '\\/([^\\/]+)\\/(\\d+)'))

freeze('version', '1.0.0')
freeze('desc', `JavaScript layer for ${OS_NAME} hybrid framework.`)
freeze('deviceName', () => {
    // Mozilla/5.0 (Linux Android 5.1 MX5 Build/LMY471) AppleWebKit/600.1.3
    // return matchArray(UA, ['m1', 'm2', 'm note', 'm note2', 'm metal', 'MX3', 'MX4', 'MX4 Pro', 'MX5', 'PRO5', 'Unknown'])
    let m = UA.match(/\s*([^]+)\s+Build/)
    return m ? m[1] : 'Unknown'
})
freeze('os', matchArray(UA, [OS_NAME, 'Unknown']))
freeze('isInApp', Hybrid.os == OS_NAME)
freeze('appName', m ? m[1] : '')
freeze('appVersion', m ? m[2] : 0)

Hybrid.debug = 0
// 所有web提供给Native的接口都放到Hybrid.web对象上，避免冲突
Hybrid.web = {}

freeze('wrapAPI', () => wrapAPI)
freeze('assign', () => assignAPI)
freeze('invokeApp', () => invokeAppApi)
freeze('invokeWeb', () => invokeWebApi)
freeze('notifyWeb', () => appNotifyWeb)
freeze('on', () => on)
freeze('off', () => off)
// freeze('emit', () => emit)
freeze('util', () => {return { serialize, resolveUrl, parseUrl }})

// 这里只处理了iframe一层嵌套的情况
if(IS_IN_IFRAME) {
    console.info(`${API_ROOT} running in iframe.`)

    try {
        let parent = WIN.parent
        let iframes = parent.document.getElementsByTagName('iframe')
        let selfHref = WIN.self.location.href
        let selfWin
        for(let i=0; i<iframes.length; i++)
            if(iframes[i].contentWindow.location.href === selfHref) selfWin = iframes[i].contentWindow
        // WIN.parent[API_ROOT] = Hybrid
        WIN.parent[API_ROOT] = {
            invokeWeb: selfWin[API_ROOT].invokeWeb
        }
    } catch(e) {
        if(/cross-origin/.test(e.message)) alert(`注意，在跨域的iframe里边无法使用${API_ROOT}！`)
        else throw e
    }
}

/**
 * 把调用Native接口（即Hybrid.invokeApp）封装成js命名空间的方式
 * @param  {String}   api     api name
 * @param  {Function} wrapper 处理函数
 * @usage:
 * wrapAPI('device.getStatus', function(key, callback) {
 *     Hybrid.invokeApp('status.get', {key, callback}) // => hybrid://status/get?key=xx&req_sn=xxxxxx
 * })
 * @call:
 * Hybrid.device.getStatus('xx', function(result) {})
 */
function wrapAPI(api, wrapper) {
    if(/^web\./.test(api)) throw new Error('此处不要使用`web`作为根命名空间')
    inject(api, wrapper)
}

/**
 * 开放web api供app调用
 * @param  {String}   api      api name
 * @param  {Function} handler  处理函数
 * @usage:
 * assignAPI('web.dom.getNodeText', function(options) {return $(options.id).text()})
 */
function assignAPI(api, handler) {
    // if(/^app\./.test(api)) throw new Error('此处不要使用`app`作为根命名空间')
    inject('web', api, handler)
}

function inject(ns, api, handler) {
    if(arguments.length < 3) {
        handler = arguments[1]
        api = arguments[0]
        ns = ''
    }

    let names = api.split(/\./)
    let fnName = names.pop()

    if(names[0] === ns) names.shift()

    let root = ns ? (Hybrid[ns] || (Hybrid[ns] = {})) : Hybrid

    root = createNamespace(root, names)

    if(fnName && isFn(handler)) root[fnName] = handler
}

/**
 * invoke native
 * @param  {String} api     some api assigned
 * @param  {Object}         params calls options
 * @return {Boolean}        is invoke success or not
 * @usage:
 * invokeAppApi('com.companyName.hybridSDK.handler.Network/checkAvailable', {callback: function(result) {}})
 */
function invokeAppApi(api, params) {
    if(!api) return false

    let url = `${SCHEMA}://${api}`

    if(!params) return openURL(url)

    url += '?'

    params = isFn(params) ? {callback: params} : params

    if(typeof params !== 'object') throw TypeError('params show be an Object or Function or Undefined')

    // web callback Native
    if(RES_SN_KEY in params) {
        url += `${RES_SN_KEY}=${EC(params[RES_SN_KEY])}&`
        delete params[RES_SN_KEY]
    }

    let callback = params.callback || null

    if(isFn(callback)) {
        let sn = callbackSign(
            api,
            callback,
            params.context || Hybrid,
            params.nextTick !== undefined ? params.nextTick : true
        )
        // params[REQ_SN_KEY] = sn
        delete params.callback
        delete params.context
        delete params.nextTick

        url += `${REQ_SN_KEY}=${EC(sn)}&`
    }

    url += 'value=' + EC(JSON.stringify(params))

    openURL(url)
}

/**
 * native 调用web方法以及app回调web
 * 挂在window下面也可以，不过为了方便维护，建议都挂到Hybrid.web对象上
 * @param  {String} api
 * @param  {String} str
 * @usage:
 * invokeWebApi('com.companyName.hybridSDK.handler.Network/checkAvailable', "{value: true, res_sn: 111}")
 */
function invokeWebApi(api, str) {
    if(typeof api !== 'string' || (str && typeof str !== 'string')) throw Error('参数不合法，必须是字符串')

    if(str) {
        let params = parseStr(str)
        let resSN = params ? params[RES_SN_KEY] : null
        // 回调
        if(resSN) {
            let callback = findCallback(api, resSN)

            delete params[RES_SN_KEY]

            if(isFn(callback)) callback(params.value)
        } else {
            // 调用web api
            appCallWebApi(api, str, params)
        }
    } else {
        appCallWebApi(api)
    }
}

function appCallWebApi(api, str, params) {
    let names = api.split(/\./)

    // window.api() or web.api()
    if(/window|web/.test(names[0])) names.shift()

    if(!names.length) return

    let fnName = names.pop()
    // 查找web的处理函数，其实就是对象和方法的简单映射：
    // dom.getNodeText => Hybrid.web.dom.getNodeText() 方法需要预先“挂载”到Hybrid.web上
    // 优先查找挂在Hybrid.web对象上的方法
    let handler = createNamespace(Hybrid.web, names)[fnName] || createNamespace(WIN, names)[fnName]

    if(!isFn(handler)) throw Error(`调用的方法 ${fnName} 不存在`)

    if(!params) {
        // 支持invokeWebApi('api', 'arg')这种调用方式
        handler(str)
    } else {
        // 没有回调的情况
        if(!(REQ_SN_KEY in params) || typeof String(params[REQ_SN_KEY]) !== 'string') {
            handler(params.value)
            return
        }

        let sn = params[REQ_SN_KEY]

        delete params[REQ_SN_KEY]

        let val = handler(params.value)
        let response = {}

        if(typeof val == 'object') {
            if(val instanceof HTMLElement)
                throw Error('HTMLElement instance is not allowed to return to native.')
        }

        response[RES_SN_KEY] = sn
        response['value'] = val

        // native must assign api `*.web.callback` first
        // invokeAppApi('web.callback', response)
        invokeAppApi(api.replace(/\//g, '.'), response)
    }
}

/**
 * Event
 * @param  {String} event
 * @param  {String} str optional
 * @useage:
 * appNotifyWeb('com.companyName.hybridSDK.event.eventName', JSON.stringify({value: 'xxx'}))
*/
function appNotifyWeb(event, str) {
    if(typeof event !== 'string' || (str && typeof str !== 'string')) throw Error('参数不合法，必须是字符串')

    if(str) {
        let params = parseStr(str)
        emit(event, params.value)
    } else {
        emit(event)
    }
}

function parseStr(str) {
    str = decodeURIComponent(str)

    let params

    try {
        params = JSON.parse(str)
    } catch(e) {
        if(/{/.test(str)) throw e
        params = null
    }

    return params
}

/**
 * on('mback', function(data) {})
 */
function on(event, handler) {
    if(!event) return

    let fns = HANDLERS[event]

    if(!isFn(handler)) return false

    if(!handler.name) console.warn(`绑定事件的handler请尽量不用匿名函数！`)

    if(!fns) {
        fns = handler
        // 只通知客户端监听一次
        invokeAppApi(`${event}/listen`)
    } else {
        if(!IS_ARR(fns)) fns = [fns]
        if(IS_ARR(fns) && ~fns.indexOf(handler)) return
        fns.push(handler)
    }

    HANDLERS[event] = fns
}

function emit(event, data) {
    if(!event) {
        if(Hybrid.debug) console.warn('Receive empty event')
        return
    }

    let fns = HANDLERS[event]

    if(IS_ARR(fns)) fns.forEach((fn) => {fn(data)})
    else if(isFn(fns)) fns(data)
}

function off(event, handler) {
    if(!event) return

    invokeAppApi(`${event}/removeListen`)

    if(!(event in HANDLERS)) return

    if(isFn(handler)) {
        let fns = HANDLERS[event]

        if(IS_ARR(fns)) {
            HANDLERS[event] = fns.filter((fn) => {
                return fn != handler
            })

            HANDLERS[event].length !== fns.length
        } else {
            fns == handler ? delete HANDLERS[event] : false
        }
    } else {
        delete HANDLERS[event]
    }
}

function createNamespace(root, names) {
    let i = 0
    let a

    while(a = names[i++]) {
        if(a in root && 'object' !== type(root[a])) throw Error(`${a} 命名空间冲突`)
        if(!(a in root)) root[a] = {}
        root = root[a]
    }

    return root
}

function callbackSign(api, callback, context, nextTick) {
    if(isFn(callback)) {
        // api = api.replace(/\./g, '/')
        let sn = WEB_CB_SN_PREFIX + Date.now()
        let map = CALLBACKS[api] || (CALLBACKS[api] = {})

        // 注意，箭头函数没有arguments！！
        map[sn] = function(value) {
            let args = SLICE.call(arguments)

            if(!nextTick) {
                callback.apply(context, args)
            } else {
                setTimeout(() => {
                    callback.apply(context, args)
                }, 0)
            }

            delete map[sn]
        }

        return sn
    }

    return ''
}

function findCallback(api, sn) {
    // api = api.replace(/\./g, '/')

    return (CALLBACKS[api] || {})[sn]
}

function openURL(url) {
    // for debug in browsers
    if(!Hybrid.isInApp || Hybrid.debug) console.info('Request url: %s\nOrigin url: %s', url, decodeURIComponent(url))

    if(!Hybrid.isInApp) return

    let iframe = document.createElement('iframe')

    // Android必须先赋值再append
    document.body.appendChild(iframe)

    iframe.style.cssText = 'display:none;width:0px;height:0px'
    iframe.src = url
    // iframe.onload = function() {}

    setTimeout(function() {
        iframe.parentNode.removeChild(iframe)
    }, 0)

    return true
}

function freeze(k, v, o = Hybrid) {
    if('__defineGetter__' in o) o.__defineGetter__(k, () => {return isFn(v) ? v() : v})
    else o[k] = isFn(v) ? v() : v
}

function serialize(obj) {
    let r = []

    for(let k in obj) {
        let v = obj[k]

        if(typeof v == 'object') v = JSON.stringify(v)

        r.push(k + '=' + v)
    }

    return r.join('&')
}

function matchArray(str, arr) {
    for(let i=0; i<arr.length; i++) {
        if(new RegExp(arr[i]).test(str)) return arr[i].replace(/\s+/, '')
    }

    return 'Other'
}

function resolveUrl(url) {
    if(!url) return url

    url = url.trim()

    if(!/^http(''|s)?:\/\//.test(url)) {
        let parsed = parseUrl(url)

        url = url.replace(/^(?:\.)?\//,'')
        url = parsed.protocol + '//' + parsed.host + '/' + url
    }

    return url
}

function parseUrl(url) {
    let a = document.createElement('a')

    a.href = (url || 'x.html')

    return {
        protocol: a.protocol.replace(':', ''),
        host: a.host,
        port: a.port,
        pathname: a.pathname,
        search: a.search,
        hash: a.hash
    }
}

function type(o) {
    return Object.prototype.toString.apply(o).slice(8, -1).toLowerCase()
}

function isFn(fn) {
    return type(fn) === 'function'
}

function noop() {
    let args = SLICE.call(arguments)
    let callback = args.length && args[args.length - 1]

    return isFn(callback) ? callback(null) : null
}

module.exports = Hybrid
