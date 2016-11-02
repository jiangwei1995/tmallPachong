var express = require('express');
var cheerio = require('cheerio');
var request = require('request');
var _ = require('underscore');
var q = require('q');
var app = express();
app.listen(1337);

app.get('/', function (req, res) {
  var promiseRequest = q.denodeify(request);
  //多页查询需要优化
  var taskssub =  _.reduce(
    new Array(2),
    function(momesub, itemsub, index){
      momesub.push(
        q.Promise(
          function(qresolve){
            console.log('http://www.itjuzi.com/company?page='+ (index+1));
            promiseRequest('http://www.itjuzi.com/company?page='+ (index+1))
              .then(function (result) {
                var $ = cheerio.load(result[0].body);
                var arr = _.map(
                  $('.list-main-icnset').last().children().map(
                    function (i, el) {
                      var productName = $('.maincell .title a span', el).text();
                      var detailsLink = $('.maincell .title a', el).attr('href');
                      return {
                        productName: productName,
                        detailsLink: detailsLink
                      };
                    }
                  ),
                  function (val) {
                      return val;
                  });
                  return arr
                  }).then(function(arr){
                   // console.log(arr);
                    var tasks = _.reduce(arr, function(mome, item){
                         mome.push(promiseRequest(item.detailsLink));
                         return mome;
                      },[]);
                    return q.Promise(function(resolve, reject, notify) {
                      q.all(tasks).then(function(result){
                          arr = _.reduce(result,function(mome, item, index){
                          var $ = cheerio.load(item[0].body);
                          var address = $('.marr10').text().replace(/\s+/g,"");
                          var companyName = $('.des-more div span').first().text().replace('公司全称：',"").replace(/\s+/g,"");
                          var companyLink = $('.linkset').text().replace(/\s+/g,"");
                          mome[index].address = address;
                          mome[index].companyName = companyName;
                          mome[index].companyLink = companyLink;
                          return mome;
                        },arr);
                        //res.send(arr);
                        resolve(arr);
                      });
                    }); 
                  }).then(function(result){
                    qresolve(result);
                  })
                  .fail(function (err) {
                    console.log(err);
                    res.send('not ok');
                  })}));
                return momesub;
                },[]);
  
    q.all(taskssub).then(function(result){
      res.send(_.flatten(result));
    });
    
    //一页查询
  // promiseRequest('http://www.itjuzi.com/company?page='+ index+1)
  //   .then(function (result) {
  //     var $ = cheerio.load(result[0].body);
  //     var arr = _.map($('.list-main-icnset').last().children().map(function (i, el) {
  //       var productName = $('.maincell .title a span', el).text();
  //       var detailsLink = $('.maincell .title a', el).attr('href');
  //       return {
  //         productName: productName,
  //         detailsLink: detailsLink
  //       };
  //     }), function (val) {
  //       return val;
  //     });
  //     return arr
  //   }).then(function(arr){
  //     var tasks = _.reduce(arr, function(mome, item){
  //          mome.push(promiseRequest(item.detailsLink));
  //          return mome;
  //       },[]);
  //     return q.Promise(function(resolve, reject, notify) {
  //       q.all(tasks).then(function(result){
  //           arr = _.reduce(result,function(mome, item, index){
  //           var $ = cheerio.load(item[0].body);
  //           var address = $('.marr10').text().replace(/\s+/g,"");
  //           var companyName = $('.des-more div span').first().text().replace('公司全称：',"").replace(/\s+/g,"");
  //           var companyLink = $('.linkset').text().replace(/\s+/g,"");
  //           mome[index].address = address;
  //           mome[index].companyName = companyName;
  //           mome[index].companyLink = companyLink;
  //           return mome;
  //         },arr);
  //         //res.send(arr);
  //         resolve(arr);
  //       });
  //     });
          
  //   }).then(function(arr){
  //     //console.log("arr",arr);
  //     var tasks = _.reduce(arr, function(mome, item){
  //          mome.push(promiseRequest(item.companyLink));
  //          return mome;
  //       },[]);
  //     q.all(tasks).then(function(result){
  //       arr = _.reduce(result,function(mome, item, index){
  //           var $ = cheerio.load(item[0].body);
  //           var link = $('body').find('加入我们').html();
  //           //console.log(link);
  //           return mome;
  //         },arr);
  //     });
  //     return arr;
  //   })
  //   .fail(function (err) {
  //     console.log(err);
  //     res.send('not ok');
  //   });
});
