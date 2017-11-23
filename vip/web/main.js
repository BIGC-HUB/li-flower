Sea.Ajax({
    url: '/user_sign_in/sms',
    data: {
        phone: '18966702120',
    }
}).then(res => {
    log(res)
})
