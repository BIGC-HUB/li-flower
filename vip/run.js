const log = console.log.bind(console, '>>>')
// 引入 express 并且创建一个 express 实例赋值给 app
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const SMSClient = require('@alicloud/sms-sdk')

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

// 先初始化一个 express 实例
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

// 验证码
app.post('/user_sms', function(req, res) {
    let phone = req.body.phone
    let path = './data/today.json'
    let data = JSON.parse(fs.readFileSync(path, 'utf8'))
    if (data[phone]) {
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
app.post('/user_login', function(req, res) {
    let phone = req.body.phone
    let path = './data/today.json'
    let users = JSON.parse(fs.readFileSync(path, 'utf8'))
    if (users[phone]) {
        res.send({ok:false, message:'已注册，请登录'})
    } else {
        if (users[phone].sms === req.body.phone_sms) {
            let date = Mer.time()
            users[phone] = req.body
            let json =  JSON.stringify(users, null, 2)
            let err  = fs.writeFileSync(`./data/backup/${date}.json`, json, 'utf8')
            let err2 = fs.writeFileSync('./data/today.json', json, 'utf8')
            if (err && err2) {
                res.send({ok:false, message:'写入失败'})
                return;
            } else {
                res.send({ok:true, message:'注册成功'})
                return;
            }
        } else {
            res.send({ok:false, message:'验证码错误'})
        }
    }
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

// listen 函数监听端口
let server = app.listen(8001, '0.0.0.0', function () {
    let ip = server.address().address
    if (ip === '0.0.0.0') {
        ip = Mer.getLocalIP()
    }
    let port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", ip, port)
})
