var request = require('request');
var http = require("http");
var _ = require('lodash');
var fs = require('fs');
var mkdirp = require('mkdirp');
var cheerio =require('cheerio');
var iconv =require('iconv-lite');
var async = require('async');

var ids = require('./ids');

	 
	var tasks = _.reduce(ids,function(prev,curr,index){
		prev.push(getProduct(curr));
		return prev
	},[]);
	Promise.all(tasks).then(function(result){
		console.log(result);
	})
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
				  }
				})

			},function(callback){
				//getProduct desc
				request("http://hws.m.taobao.com/cache/wdesc/5.0?id="+id).pipe(iconv.decodeStream('gbk'))
					.collect(function(err, body) { 
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
				results[0].desc = results[1];
				fs.writeFile(dir + "/"+id+".json", JSON.stringify(results[0],null,4),function(err,result){
					resolve('ok');
				});
				
			})
	})	

}
var download = function(url, dir, filename){
		request.head(url, function(err, res, body){
			request(url).pipe(fs.createWriteStream(dir + "/" + filename));
		});
	};