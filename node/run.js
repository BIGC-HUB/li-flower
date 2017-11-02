const log = console.log.bind(console, '>>>')
const config = require('../data/config')
const mongo = require('./mongo')
// 引入 express 并且创建一个 express 实例赋值给 app
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const session = require('cookie-session')
const crypto = require('crypto')
const Alidayu = require('super-alidayu')

// 先初始化一个 express 实例
const app = express()

// 公开文件
app.use(express.static('web'))

// 设置 bodyParser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// 设置 session
app.use(session({
    secret: config.key,
    // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000
}))

// User 保存注册未完成信息
const User = {}
const Mer = {
    // 本地 ip
    getLocalIP() {
        let os = require("os")
        let interfaces = os.networkInterfaces ? os.networkInterfaces() : {}
        let arr = []
        for (let k in interfaces) {
            for (let k2 in interfaces[k]) {
                let address = interfaces[k][k2]
                if (address.family === "IPv4" && !address.internal) {
                    arr.push(address.address)
                }
            }
        }
        return arr[0]
    },
    // 设置 sms
    sms() {
        return String(parseInt(Math.random()*(10000-1000)+1000))
    },
    AlidayuClient: new Alidayu({
        app_key: config.alidayu.app_key,
        secret:  config.alidayu.secret
    }),
    // 参数 params
    params(obj) {
        let html = '<params '
        for (let key in obj) {
            let e = obj[key] || ''
            html += `data-${key}="${e}"`
        }
        return html + '></params>'
    },
    // 开发 dev
    ku: require('./tree'),
    css(key, dev) {
        let o = Mer.ku[key].css
        let initCSS = function(arr) {
            let s = ''
            for (let i of arr) {
                s += '<link href="' + i + '" rel="stylesheet">'
            }
            return s
        }
        let html =  initCSS(o.public)
        if (dev) {
            html += initCSS(o.dev)
        } else {
            html += initCSS(o.min)
        }
        return html
    },
    js(key, dev, params) {
        let o = Mer.ku[key].js
        let initJS = function(arr) {
            let s = ''
            for (let i of arr) {
                s += '<script src="' + i + '"></script>'
            }
            return s
        }
        let html =  Mer.params(params) + initJS(o.public)
        if (dev) {
            html += initJS(o.dev)
        } else {
            html += initJS(o.min)
        }
        return html
    },
    initHTML(key, header, params) {
        let html = fs.readFileSync(Mer.ku[key].path, 'utf8').replace(/>(\s+)</img, '><')
        let host = header.host.split(':')[0]
        // 匹配 IP 地址
        let ip = host.split('.').join('')
        let dev = !isNaN(ip) ? true : false
        html = html.replace('<!-- bigsea-js -->',  Mer.js(key, dev, params))
        html = html.replace('<!-- bigsea-css -->', Mer.css(key, dev))
        return html
    },
    //
    md(arr) {
        let s = []
        for (let e of  arr) {
            s.push({
                name: e.name || '新建笔记',
            })
        }
        return s
    },
}

app.get('/', function(req, res) {
    let html = Mer.initHTML('mer', req.headers)
    res.send(html)
})
// 加载
app.post('/user/load', async function (req, res) {
    let phone = req.session.phone ? req.session.phone : '18966702120'
    let o = await mongo.load({
        phone: phone
    }, ['mer', 'name', 'md'])
    let data = {
        ok: false,
        mer: o.mer,
        name: o.name,
        md: Mer.md(o.md),
    }
    if (req.session.phone) {
        data.ok = true
    } else {
        // md
        data.md = []
        // del note
        data.mer.note =  ''
    }
    res.send(data)
})
// 存储
app.post('/user/save', async function (req, res) {
    if (req.session.phone) {
        let query = {
            phone: req.session.phone
        }
        let data = {
            mer: req.body
        }
        if (data.mer.book && data.mer.sou) {
            let save = await mongo.save(query, data)
            res.send(save.message)
            return;
        }
    }
    res.send('数据有误')
})
// 登陆
app.post('/user/login', async function (req, res) {
    let data = await mongo.load({
        $or: [{
            name: req.body.name
        }, {
            phone: req.body.name
        }]
    })
    let result = {}
    // md
    if (data) {
        if (data.key === req.body.key) {
            // 设置cookie
            req.session.phone  = data.phone
            result = {
                ok: true,
                mer: data.mer,
                name: data.name,
                md: Mer.md(data.md),
            }
        } else {
            result = {
                ok: false,
                message: '密码错误'
            }
        }
    } else {
        result = {
            ok: false,
            message: '用户不存在'
        }
    }
    res.send(result)
})
// 注册 短信
app.post('/user/join-sms', async function (req, res) {
    let phone = req.body.phone
    let data = await mongo.load({
        phone: phone
    }, ["phone"])
    if (data) {
        res.send({ok:false, message:'已注册，请登录'})
    } else {
        User[phone] = {}
        User[phone].sms = Mer.sms()
        // 发送短信 promise 方式调用
        let options = {
            sms_free_sign_name: config.alidayu.sms_free_sign_name,
            sms_param: {
                "number": User[phone].sms
            },
            "rec_num": phone,
            sms_template_code: config.alidayu.sms_template_code
        }
        // 花钱的地方来了 take money this
        Mer.AlidayuClient.sms(options).then(function(data) {
            res.send({ok:true, message:'短信已发送，请耐心等候'})
        }).catch(function(err) {
            delete User[phone]
            res.send({ok:false, message:'短信发送失败，请联系管理员'})
        })
    }
})
// 注册
app.post('/user/join', function (req, res) {
    // res.send({
    //     ok: true,
    //     phone: req.body.phone,
    //     message: '欢迎加入，不知阁下如何称呼'
    // })
    let phone = req.body.phone
    let sms = req.body.sms
    if (User[phone]) {
        if (sms === User[phone].sms) {
            delete  User[phone]
            res.send({
                ok: true,
                phone: phone,
                message: '欢迎加入，不知阁下如何称呼'
            })
        } else {
            res.send({
                ok: false,
                message: '短信验证错误'
            })
        }
    } else {
        res.send({
            ok: false,
            message: '尚未发送短信验证'
        })
    }
})
// 注册 名字
app.post('/user/join-name', async function (req, res) {
    let re = new RegExp(`^${req.body.name}$`, 'i')
    // 读取
    let data = await mongo.load({
        name: re
    }, ["name"])
    if (data) {
        res.send({
            ok: false,
            message: req.body.name + ' 已被占用'
        })
    } else {
        res.send({
            ok: true,
            message: req.body.name + ' 可以使用'
        })
    }
})
// 注册 保存
app.post('/user/join-save', async function (req, res) {
    let name = req.body.name
    let phone = req.body.phone
    // 初始化
    let sea = await mongo.load({phone: '13509185504'}, ["mer"])
    let data = {
        mer: sea.mer,
        name: name,
        phone: phone,
        key: phone.slice(-4)
    }
    data.mer.note = '🍓 ' + name + '\n'
    // 写入
    let query = {
        phone: phone
    }
    let save = await mongo.save(query, data)
    if (save.ok) {
        delete User[phone]
        res.send({
            ok: true,
            message: '注册成功！ 初始密码：' + phone.slice(-4)
        })
    } else {
        res.send({
            ok: false,
            message: '写入失败，请联系管理员'
        })
    }
})
// 登出
app.post('/user/exit', async function (req, res) {
    // 清除cookie
    req.session = null
    let data = await mongo.load({
        phone: "18966702120"
    })
    data.mer.note = ''
    res.send({
        mer: data.mer,
        name: data.name
    })
})

app.get('/note/:name?/:id?', function(req, res) {
    html = Mer.initHTML('md', req.headers, req.params)
    res.send(html)
})
// 笔记 读取
app.post('/note/load', async (req, res) => {
    let phone = req.session.phone
    // 读取
    let o = await mongo.load({
        name: req.body.name,
    }, ['md', 'phone'])
    // 初始
    let data = {
        ok: false,
        arr: [],
        msg: '笔记不存在',
        edit: false,
        name: '',
    }
    // 验证
    if (o) {
        // 登陆
        if (phone === o.phone) {
            data.edit = true
        }
        if (o.md) {
            let obj = o.md[req.body.id]
            if (obj) {
                data.name = obj.name
                data.arr = obj.now
                data.ok = true
                data.msg = '读取成功！'
            }
        }
    }
    res.send(data)
})
// 笔记 写入
app.post('/note/save', async (req, res) => {
    let info  = req.body.info
    let query = {
        phone: req.session.phone,
        name: info.name,
    }
    // 拿数据
    let o = await mongo.load(query, ['md'])
    // 改数据
    if (o) {
        if (o.md) {
            if (o.md[info.id]) {
                o.md[info.id].now = req.body.arr
                // 存数据
                let data = {
                    md: o.md
                }
                let save = await mongo.save(query, data)
                res.send(save.message)
                return;
            }
        }
    }
    res.send('未登录！')
})
// 笔记 添加命名
app.post('/note/update', async (req, res) => {
    let arr = req.body
    let query = {
        phone: req.session.phone,
    }
    // 拿数据
    let o = await mongo.load(query, ['md'])
    // 改数据
    if (o) {
        if (o.md) {
            for(let i = 0; i < arr.length; i++) {
                let e = arr[i]
                if (o.md[i]) {
                    // 修改笔记
                    o.md[i].name = e.name
                } else {
                    // 添加笔记
                    o.md[i] = {
                        name: e.name,
                        now: [],
                    }
                }
            }
            // 存数据
            let data = {
                md: o.md
            }
            let save = await mongo.save(query, data)
            res.send(save.message)
            return;
        }
    }
    res.send('数据有误！')
})


// 404
app.use((req, res) => {
    res.status(404)
    res.send(fs.readFileSync('web/mer/html/404.html', 'utf8'))
})
// 500
app.use((err, req, res, next) => {
    console.error('出现错误', err.stack)
    res.status(500)
    res.send('出现错误')
})

// listen 函数监听端口
let server = app.listen(1207, '0.0.0.0', function () {
    let ip = server.address().address
    if (ip === '0.0.0.0') {
        ip = Mer.getLocalIP()
    }
    let port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", ip, port)
})
