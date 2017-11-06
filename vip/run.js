const log = console.log.bind(console, '>>>')
// 引入 express 并且创建一个 express 实例赋值给 app
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')

// 先初始化一个 express 实例
const app = express()
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
    }
}

// 公开文件
app.use(express.static('web'))

// 设置 bodyParser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// 读取
app.post('/load', function(req, res) {
    let path = './data/today.json'
    res.send(fs.readFileSync(path, 'utf8'))
})
// 写入
app.post('/save', function(req, res) {
    let date = Mer.time()
    let path = `./data/backup/${date}.json`
    let json =  JSON.stringify(req.body, null, 2)
    let err  = fs.writeFileSync(path, json, 'utf8')
    let err2 = fs.writeFileSync('./data/today.json', json, 'utf8')
    if (err && err2) {
        res.send('写入失败')
        return;
    } else {
        res.send('写入成功')
        return;
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
let server = app.listen(3000, '0.0.0.0', function () {
    let ip = server.address().address
    if (ip === '0.0.0.0') {
        ip = Mer.getLocalIP()
    }
    let port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", ip, port)
})
