Sea.Ajax({
    url: '/user_login',
    data: {
        "sms": true,
        "sex": "女士",
        "province": "北京市",
        "city": "北京市",
        "town": "宣武区",
        "phone": "17396200129",
        "phone_sms": "9357",
        "sea_id": 1511426464515
        wx: {
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
        }
    }
}).then(res => {
    log(res)
})
// 注册
