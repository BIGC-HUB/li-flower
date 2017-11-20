module.exports = {
    brage: async function(req) {
        // client
        let client = (req.client == 'https') ? require('https') : require('http')
        // search
        let search = Object.keys(req.search)
        if (search.length) {
            let arr = []
            for (let key of search) {
                let val = req.search[key]
                arr.push([key, val].join('='))
            }
            req.options.path += '?' + arr.join('&')
        }
        // req
        let request = function(options){
            return new Promise(function(success, fail){
                let req = client.request(options, function(res){
                    let data = []
                    res.on('data', function(e){
                        data.push(e)
                    })
                    res.on('end', function(){
                        success(data)
                    })
                })
                req.on('error', function(err){
                    fail(err)
                })
                req.end()
            })
        }
        let data = await request(req.options)
        return data
    }
}
