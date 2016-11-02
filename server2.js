var request = require('request');
var http = require("http");
var _ = require('lodash');
var fs = require('fs');
var mkdirp = require('mkdirp');
var cheerio =require('cheerio');
var iconv =require('iconv-lite');
var async = require('async');
var queuefun = require('queue-fun');
var Queue = queuefun.Queue();
var queue1 = new Queue(2,{
    "event_succ":function(data){  console.log('queue-succ:',data)}  //成功
    ,"event_err":function(err){console.log('queue-err:',data)}  //失败
    ,"retryON":1
    
}); 

    var ids = require('./ids');

	for (var i = ids.length - 1; i >= 0; i--) {
		 console.log(ids[i]);
		 queue1.push(getProduct,[ids[i]]);
	}
	queue1.start();
	// var tasks = _.reduce(ids,function(prev,curr,index){
	// 	prev.push(getProduct(curr));
	// 	return prev
	// },[]);
	// Promise.all(tasks).then(function(result){
	// 	console.log(result);
	// })

	function getProduct(id){
		return new Promise(function(resolve,reject){
			var product = {};
			
			var dir = './product/'+id;
				 
			//创建目录
			mkdirp(dir, function(err) {
				if(err){
					console.log(err);
				}
			});
			async.parallel([function(callback){
				//getProduct detail pics
				request('http://hws.m.taobao.com/cache/wdetail/5.0/?id='+id, function (error, response, body) {
				  if (!error && response.statusCode == 200) {
				    var json = JSON.parse(body).data;
				    var datajson = JSON.parse(json.apiStack[0].value);
				    var defDyn = JSON.parse(json.extras.defDyn);
				    product.title = json.itemInfoModel.title;
				    product.skus = datajson.data.skuModel.skus;
				    console.log(json.itemInfoModel.picsPath);
				    product.pics = _.reduce(json.itemInfoModel.picsPath,function(mome,item,i){
				    	var url = json.itemInfoModel.picsPath[i];
				    	var filename =id+'-'+i + url.substr(-4,4);
				    	download(url, dir, filename);
				    	mome.push(dir + "/" + filename);
				    	return mome ;
				    },[]);
				    json.apiStack[0].value = datajson;
				    json.extras.defDyn = defDyn;
				    //fs.writeFile(dir + "/"+id+".json", JSON.stringify(json,null,4));
				   // console.log(product);
				    callback(null,json);
				  }else{
				  	 callback(error);
				  }
				})

			},function(callback){
				//getProduct desc
					request.get("http://hws.m.taobao.com/cache/wdesc/5.0?id="+id)
					.on('error', function(err) {
				    		console.log("<<<<",err)
				    		return callback(err);
				    })
					.pipe(iconv.decodeStream('gbk'))
					.on('error', function(err) {
				    		console.log("<<<<",err)
				    		return callback(err);
				    })
					.collect(function(err, body) {
					    if(err){
					    	return callback(err);
					    } 
						//console.log(body.indexOf('wdescData'));
						var descstr =   body.substring(body.indexOf('tfsContent :')+14,body.lastIndexOf('anchors :')-4);
						//console.log( descstr);
						var $ = cheerio.load(descstr);
					    $('p img').map(function (i, el) {
					    	//console.log($(el).attr('src'));
					    	download("http:"+$(el).attr('src'),dir,'desc'+i+$(el).attr('src').substr(-4,4))
					    	$(el).attr('src','desc'+i+$(el).attr('src').substr(-4,4));
					    	//console.log($(el).attr('src'));
					    })
					    var desc = $('p').html();
					    fs.writeFile(dir+"/index.html", $('p').html());
						callback(null,desc);
					})
			}],function(err,results){
				if (err) {
					return reject(id);
				}
				results[0].desc = results[1];
				fs.writeFile(dir + "/"+id+".json", JSON.stringify(results[0],null,4),function(err,result){
					resolve(id);
				});
				
			})
	})	

}
var download = function(url, dir, filename){
		request.head(url, function(err, res, body){
			request(url).on('error',function(err){
				console.log(err);
				console.log(dir, filename);
				//callback(err);
			}).pipe(fs.createWriteStream(dir + "/" + filename));
		});
	};