<script>
$('#baocun').on('click', function() {
    let o = Sea.form
    let d = {
        '省份': true,
        '地级市': true,
        '市、县、区': true,
    }
    o.province = $('#loc_province').select2('data').text
    o.city = $('#loc_city').select2('data').text
    o.town = $('#loc_town').select2('data').text

    o.phone = $('.sign .phone').val()
    o.phone_sms = $('.sign .phone-sms').val()
    o.name = $('.sign .name').val()
    if (!o.name) {
        alert('请输入姓名')
        return;
    }
    if (d[o.province] || d[o.city] || d[o.town]) {
        alert('请选择地址')
        return;
    }
    // 发送 跨域 Ajax 请求
    if (Sea.bianji) {
        Sea.Ajax({
            url: 'http://li-flower.com:8001/user_save',
            data: o,
        }).then(res => {
            let data = JSON.parse(res)
            if (data.ok) {
                alert(data.message)
                $('#bianji').click()
            } else {
                alert('保存失败')
            }
        })
    } else {
        alert('尚未修改')
    }
})
$('#bianji').on('click', function() {
    if (Sea.bianji) {
        Sea.bianji = false
        $('.sign-sex').off()
        $('#u-name, #loc_province, #loc_city, #loc_town').attr('disabled', true)
    } else {
        Sea.bianji = true
        // disabled
        $('#u-name, #loc_province, #loc_city, #loc_town').removeAttr('disabled')
        $('.sign-sex').on('click', 'btn', function() {
            $('.sign-sex btn').removeAttr('style')
            this.style.background = '#141414'
            this.style.color = 'white'
            // 性别
            Sea.form.sex = this.innerText
        })
    }
})
</script>
