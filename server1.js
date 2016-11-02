var queuefun = require('queue-fun');
var Queue = queuefun.Queue();
//var request =require('request');
var queue1 = new Queue(1,{
    "event_succ":function(data){  console.log('queue-succ:',data)}  //成功
    ,"event_err":function(err){

    console.log('queue-err:',err)}  //失败
    ,"retryON":1
    
}); 
var paths = [ 'http://img.alicdn.com/imgextra/i3/TB1XnJbNpXXXXaCXXXXXXXXXXXX_!!0-item_pic.jpg',
  'http://img.alicdn.com/imgextra/i2/2122778362/TB2hDvbXkfA11Bjy0FcXXc4cXXa_!!2122778362.jpg',
  'http://img.alicdn.com/imgextra/i1/2122778362/TB2fBPbXinB11BjSsphXXXpaXXa_!!2122778362.jpg',
  'http://img.alicdn.com/imgextra/i3/2122778362/TB2G92cXevB11BjSspnXXbE.pXa_!!2122778362.jpg',
  'http://img.alicdn.com/imgextra/i3/2122778362/TB2W8HbXbDD11BjSszfXXbwoFXa_!!2122778362.jpg' ];
var dir = './test'
 
    for (var i = paths.length - 1; i >= 0; i--) {
        var url = paths[i];
        var filename = i+paths[i].substr(-4,4);
        queue1.push(download,[url,dir,filename]);
    }
    queue1.push(download,['http://img.alicdn.com/imgextra/i3/TB1XnJbNpXXXXaCXXXXXXXXXXXX_!!0-item_pic.jpg',dir,'1.jpg']); 
    queue1.start();
function download(url, dir, filename){
    return Promise(function(resolve,reject){
        request.head(url, function(err, res, body){
            if (err) {
                console.log(err);
                reject(filename);
            }
            request(url).on('error',function(err){
                reject(filename);
                console.log(dir, filename);
            }).pipe(fs.createWriteStream(dir + "/" + filename));
        });   
    })

};