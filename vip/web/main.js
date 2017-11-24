Sea.Ajax({
    url: '/user_sign_up',
    data: {
        "wx": {
            "openid": "oeAUq1SEowuGLUciXOP3cu3pBPyY",
            "nickname": "大海",
            "sex": "先生",
            "language": "zh_CN",
            "city": "",
            "province": "Roma",
            "country": "IT",
            "headimgurl": "http:\/\/wx.qlogo.cn\/mmopen\/vi_32\/PiajxSqBRaEIN7ia30FDb9qCLNVZPOIfTuNGkBERlbwVndYERgBiaicOs7iaseobuaNLPNFos41pSNQY6KibFQgJgtZg\/0",
            "privilege": [],
            "unionid": "o-S7Z0hD3RZ7Xphthy3GiUSSLHdI",
        },
    }
}).then(res => {
    log(res)
})
// 注册
