const log = console.log.bind(console, '>>>')
// 引入 express 并且创建一个 express 实例赋值给 app
const fs = require('fs')
const http = require('http')
const bodyParser = require('body-parser')
const SMSClient = require('@alicloud/sms-sdk')
// 转发请求
const https = require('https')
const express = require('express')
const url = require('url')
const clientByProtocol = (protocol) => {
    if (protocol === 'http:') {
        return http
    } else {
        return https
    }
}
const apiOptions = () => {
    // 从环境变量里获取 apiServer 的值, 尽管这个做法不太好
    // (因为环境变量里的值相当于全局变量, 而且是无法控制的全局变量)
    // 但是大家喜欢这样用, 我们也跟着用
    const envServer = process.env.apiServer
    // 设置默认 api 服务器地址
    const defaultServer = 'http://127.0.0.1:4000'
    const server = envServer || defaultServer
    // 解析 url 之后的结果
    const result = url.parse(server)
    // api 形式的请求通常是 Content-Type: application/json
    // 提前设置好这部分
    const obj = {
        headers: {
            'Content-Type': 'application/json',
        },
        // https 相关的设置, 为了方便直接设置为 false 就可以了
        rejectUnauthorized: false,
    }
    const options = Object.assign({}, obj, result)

    if (options.href.length > 0) {
        delete options.href
    }
    return options
}
const httpOptions = (req) => {
    // 先获取基本的 api options 设置
    const baseOptions = apiOptions()
    // 设置请求的 path
    const pathOptions = {
        path: req.originalUrl,
    }
    const options = Object.assign({}, baseOptions, pathOptions)
    // 把浏览器发送的请求的 headers 全部添加到 options 中,
    // 避免出现漏掉某些关键 headers(如 transfer-encoding, connection 等) 导致出 bug 的情况
    Object.keys(req.headers).forEach((k) => {
        options.headers[k] = req.headers[k]
    })
    // 设置请求的方法
    options.method = req.method
    return options
}

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
        if (User[phone].sms === req.body.phone_sms) {
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
app.post('/user_sign_in', function(req, res) {
    let phone = req.body.phone
    let sms = req.body.sms
    let path = './data/today.json'
    let users = JSON.parse(fs.readFileSync(path, 'utf8'))
    if (users[phone]) {
        if (User[phone] && User[phone].sign_in_sms == sms) {
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
    let path = './data/today.json'
    let data = JSON.parse(fs.readFileSync(path, 'utf8'))
    if (data[phone]) {
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
    let path = './data/today.json'
    let data = JSON.parse(fs.readFileSync(path, 'utf8'))
    if (data[phone]) {
        if (User[phone] && User[phone].sign_in_sms == sms) {
            res.send({ok:true, data:data[phone], message:'登陆成功'})
        } else {
            res.send({ok:false, message:'验证码错误'})
        }
    } else {
        res.send({ok:false, message:'未注册'})
    }
})

// 转发请求
app.all('/api/*', (req, response) => {
    const options = httpOptions(req)
    log('req options', options)
    const client = clientByProtocol(options.protocol)
    // HTTP 请求原始信息
    /*
     GET /api/topic/all HTTP/1.1
     Host: 127.0.0.1:3300
     Connection: keep-alive
     Pragma: no-cache
     Cache-Control: no-cache
     User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36
     Content-Type: application/json
     Referer: http://127.0.0.1:3300/
     Accept-Encoding: gzip, deflate, sdch, br
     Accept-Language: zh-CN,zh;q=0.8,und;q=0.6
     Cookie: session=eyJ1aWQiOjF9; session.sig=2mRMt3C3rP_tqgUqQ49brX-hL4Y
     */
    // http.request 会把数据发送到 api server
    // http.request 也会返回一个请求对象
    const r = client.request(options, (res) => {
        // res.statusCode 是 api server 返回的状态码
        // 保持 express response 的状态码和 api server 的状态码一致
        // 避免出现返回 304, 导致 response 出错
        response.status(res.statusCode)
        log('debug res', res.headers, res.statusCode)
        // 回调里的 res 是 api server 返回的响应
        // 将响应的 headers 原样设置到 response(这个是 express 的 response) 中
        Object.keys(res.headers).forEach((k) => {
            const v = res.headers[k]
            response.setHeader(k, v)
        })

        // 接收 api server 的响应时, 会触发 data 事件, 作业 2 中用到过这个知识
        res.on('data', (data) => {
            // express 的 response 对象是 http 对象的加强版
            // (其实就是我们自己实现的 socket), 可以调用 http 对象的方法
            // write 是 http 对象的方法, 服务器用来发送响应数据的
            log('debug data', data.toString('utf8'))
            response.write(data)
        })

        // api server 的数据接收完成后, 会触发 end 事件
        res.on('end', () => {
            log('debug end')
            // api server 发送完数据之后, express 也告诉客户端发送完数据
            response.end()
        })

        // 响应发送错误
        res.on('error', () => {
            console.error(`error to req: ${req.url}`)
        })
    })

    // 发往 api server 的请求遇到问题
    r.on('error', (error) => {
        console.error(`请求 api server 遇到问题: ${req.url}`, error)
    })

    log('debug options method', options.method)
    if (options.method !== 'GET') {
        // req.body 是浏览器发送过来的数据,
        // 如果不是 GET 方法, 说明 req.body 有内容,
        // 转成 JSON 字符串之后发送到 api server
        const body = JSON.stringify(req.body)
        log('debug body', body, typeof body)
        // 把 body 里的数据发送到 api server
        r.write(body)
    }

    // 结束发送请求, 类似我们最初讲的 socket.destroy()
    r.end()
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
