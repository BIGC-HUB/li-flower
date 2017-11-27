const log = console.log.bind(console, '>>>')
// 引入 express 并且创建一个 express 实例赋值给 app
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const SMSClient = require('@alicloud/sms-sdk')
// 转发请求
const Sea = require('./bigsea_node')

// 配置
const config = {
    sms: {
        accessKeyId: 'LTAIQGBv2OkqQmQu',
        secretAccessKey: 'l3klQs02sshNHGeipDV25KEekoljZ5',
    },
    // alidayu: {
    //     app_key: 'LTAIQGBv2OkqQmQu',
    //     secret:  'l3klQs02sshNHGeipDV25KEekoljZ5',
    //     sms_free_sign_name: '花开福田生命美学',
    //     sms_template_code: 'SMS_108985003'
    // },
    key: 'li-flower',
}
const app = express()

// 服务器端配置 引入 cors 模块
const cors = require('cors')
// 配置 cors
app.use(cors({
    origin: 'http://li-flower.com',
    // origin: '*',
    // some legacy browsers (IE11, various SmartTVs) choke on 204
    optionsSuccessStatus: 200,
}))

const Mer = {
    search(key, val) {
        let path = './data/today.json'
        let data = JSON.parse(fs.readFileSync(path, 'utf8'))
        for(let id in data) {
            let e = data[id]
            if (e[key] == val) {
                return e
            }
        }
        return undefined
    },
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
    // 日期 time
    time(z) {
        if (z === undefined) { z = new Date() }
        let x = z.toString()
        let zh     = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday','friday', 'saterday']
        let Year   = x.slice(11,15)
        let Month  = z.getMonth() + 1
        let Day    = x.slice(8,10)
        let Hour   = x.slice(16,18)
        let Minute = x.slice(19,21)
        let Second = x.slice(22,24)
        let Week   = zh[z.getDay()]
        if (String(Month).length === 1) {
            Month = '0' + Month
        }
        return `${Year}-${Month}-${Day}-${Week}`
    },
    sms() {
        return String(parseInt(Math.random()*(10000-1000)+1000))
    },
    smsClient: new SMSClient({
        accessKeyId: config.sms.accessKeyId,
        secretAccessKey: config.sms.secretAccessKey,
    })
}
// let smsClient =
const User = {}

// 公开文件
app.use(express.static('web'))

// 设置 bodyParser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// 主页
app.get('/', (req, res) => {
    res.render('index.html')
})
// 验证码
app.post('/user_sms', function(req, res) {
    let phone = req.body.phone
    let u = Mer.search('phone', phone)
    if (u) {
        res.send({ok:false, message:'已注册，请登录'})
    } else {
        User[phone] = {}
        User[phone].sms = Mer.sms()
        // 发送短信
        Mer.smsClient.sendSMS({
            PhoneNumbers: phone,
            SignName: '花开福田生命美学',
            TemplateCode: 'SMS_108985003',
            TemplateParam: `{"code":"${User[phone].sms}","product":"云通信"}`
        }).then(function (data) {
            let {Code} = data
            if (Code === 'OK') {
                // 处理返回参数
                res.send({ok:true, message:'短信已发送，请耐心等候'})
            }
        }, function (err) {
            // console.log(err)
            delete User[phone]
            res.send({ok:false, message:'短信发送失败，请联系管理员'})
        })
    }
})
app.post('/user_sign_up', function(req, res) {
    let path = './data/today.json'
    let users = JSON.parse(fs.readFileSync(path, 'utf8'))
    if (req.body.wx) {
        let o = req.body.wx
        let u = Mer.search('unionid', o.unionid)
        let sea_id = Date.now()
        if (u) {
            sea_id = u.sea_id
        } else {
            while (users[sea_id]) {
                sea_id = Date.now()
            }
        }
        let temp = {
            "sms": false,
            "sex": o.sex,
            "sea_id": sea_id,
            "head": o.headimgurl,
            "name": o.nickname,
            "unionid": o.unionid,
            "openid": o.openid,
        }
        users[sea_id] = Object.assign({}, temp, u)
    } else {
        let phone = req.body.phone
        let u = Mer.search('phone', phone)
        if (u) {
            res.send({ok:false, message:'已注册，请登录'})
        } else {
            if (User[phone].sms === req.body.phone_sms) {
                let sea_id = Date.now()
                while (users[sea_id]) {
                    sea_id = Date.now()
                }
                users[sea_id] = req.body
            } else {
                res.send({ok:false, message:'验证码错误'})
            }
        }
    }
    let json =  JSON.stringify(users, null, 2)
    let date =  Mer.time()
    let err  = fs.writeFileSync(`./data/backup/${date}.json`, json, 'utf8')
    let err2 = fs.writeFileSync('./data/today.json', json, 'utf8')
    if (err && err2) {
        res.send({ok:false, message:'写入失败'})
        return;
    } else {
        res.send({
            ok:true,
            data: users[sea_id],
            message:'写入成功',
        })
        return;
    }
})
app.post('/user_save', function(req, res) {
    let sea_id = req.body.sea_id
    let path = './data/today.json'
    let users = JSON.parse(fs.readFileSync(path, 'utf8'))
    if (users[sea_id]) {
        users[sea_id] = Object.assign({}, users[sea_id], req.body)
    }
    let json =  JSON.stringify(users, null, 2)
    let date =  Mer.time()
    let err  = fs.writeFileSync(`./data/backup/${date}.json`, json, 'utf8')
    let err2 = fs.writeFileSync('./data/today.json', json, 'utf8')
    if (err && err2) {
        res.send({ok:false, message:'写入失败'})
        return;
    } else {
        res.send({ok:true, message:'写入成功'})
        return;
    }
})
app.post('/user_sign_in', function(req, res) {
    let phone = req.body.phone
    let sms = req.body.sms
    let u = Mer.search('phone', phone)
    if (u) {
        if (u.sign_in_sms == sms) {
            res.send({ok:true, message:'登陆成功'})
        } else {
            res.send({ok:true, message:'验证码错误'})
        }
    } else {
        res.send({ok:false, message:'未注册'})
    }
})

app.post('/user_sign_in/sms', function(req, res) {
    let phone = req.body.phone
    let u = Mer.search('phone', phone)
    if (u) {
        User[phone] = {}
        User[phone].sign_in_sms = Mer.sms()
        // 发送短信
        Mer.smsClient.sendSMS({
            PhoneNumbers: phone,
            SignName: '花开福田生命美学',
            TemplateCode: 'SMS_108985003',
            TemplateParam: `{"code":"${User[phone].sign_in_sms}","product":"云通信"}`
        }).then(function (data) {
            let {Code} = data
            if (Code === 'OK') {
                // 处理返回参数
                res.send({ok:true, message:'短信已发送，请耐心等候'})
            }
        }, function (err) {
            // console.log(err)
            delete User[phone]
            res.send({ok:false, message:'短信发送失败，请联系管理员'})
        })
    } else {
        res.send({ok:false, message:'未注册'})
    }
})
app.post('/infocenter', function(req, res) {
    let phone = req.body.phone
    let sms = req.body.sms
    let u = Mer.search('phone', phone)
    if (u) {
        if (User[phone] && User[phone].sign_in_sms == sms) {
            res.send({ok:true, data:u, message:'登陆成功'})
        } else {
            res.send({ok:false, message:'验证码错误'})
        }
    } else {
        res.send({ok:false, message:'未注册'})
    }
})

app.post('/wx_api/sign_in', function(req, res) {
    Sea.bridge({
        client: 'https',
        option: {
            method: 'get',
            hostname: 'api.weixin.qq.com',
            path: '/sns/oauth2/access_token',
            headers: {
                'Content-Type': 'application/json',
            },
        },
        search: {
            appid: 'wxff4c7994aa0ca9cf',
            secret: 'ff5109a8c206163db869cb873f43dea9',
            code: req.body.code,
            grant_type: 'authorization_code',
        }
    }).then(json => {
        res.send(json)
    })
})
app.post('/wx_api/userinfo', function(req, res) {
    Sea.bridge({
        client: 'https',
        option: {
            method: 'get',
            hostname: 'api.weixin.qq.com',
            path: '/sns/userinfo',
            headers: {
                'Content-Type': 'application/json',
            },
        },
        search: {
            openid: req.body.openid,
            access_token: req.body.access_token,
        }
    }).then(json => {
        res.send(json)
    })
})

// 404
app.use((req, res) => {
    res.status(404)
    res.send('404')
})
// 500
app.use((err, req, res, next) => {
    console.error('出现错误', err.stack)
    res.status(500)
    res.send('错误500')
})


// 用户更新
// let path = './data/today.json'
// let data = JSON.parse(fs.readFileSync(path, 'utf8'))
// let o = {}
// for (let phone in data) {
//     let sea_id = Date.now()
//     while (o[sea_id]) {
//         sea_id = Date.now()
//     }
//     data[phone]['sea_id'] = sea_id
//     o[sea_id] = data[phone]
// }
// let json =  JSON.stringify(o, null, 2)
// let err  = fs.writeFileSync(path, json, 'utf8')


// listen 函数监听端口
let server = app.listen(8001, '0.0.0.0', function () {
    let ip = server.address().address
    if (ip === '0.0.0.0') {
        ip = Mer.getLocalIP()
    }
    let port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", ip, port)
})
