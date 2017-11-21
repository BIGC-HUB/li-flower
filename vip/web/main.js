

// {"access_token":"4_RStpc5jIIUKtopt1VtNeyeJeQh_YcLXWLKa8hV1zh4smt80mLi-wWkn57a6BAm--yF9TNnwnDNzyzGbWQDrUQA","expires_in":7200,"refresh_token":"4_ZW_UCh0NnnT2fbi_B_XwRAnk98xHxx4--SvfgNJLcg9klsOwqeqXacsVmccseKs0-n3gza9uTZii4Ivz1xKOZQ","openid":"oeAUq1SEowuGLUciXOP3cu3pBPyY","scope":"snsapi_login","unionid":"o-S7Z0hD3RZ7Xphthy3GiUSSLHdI"}
/*
http://li-flower.com/infocenter/
?code=011C2XM31CcixP1tuJN31iDxM31C2XMx
&state=3340

https://api.weixin.qq.com/sns/oauth2/access_token?appid=wxff4c7994aa0ca9cf&secret=ff5109a8c206163db869cb873f43dea9&code=081J9BxH1dblV70U0VzH1MKwxH1J9BxH&grant_type=authorization_code
*/

Sea.Ajax({
    url: '/api',
    data: {
        code: '021VPSWj2GgEQF0tdnVj2KQiXj2VPSW9',
    }
}).then(res => {
    log(res)
})
