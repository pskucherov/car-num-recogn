/*var tesseract = require('tesseract_native');
var myocr = new tesseract.OcrEio();
var fs = require('fs');

var i = 3;



fs.readFile( __dirname + '/lets' + i + '.png', function (err, data) {

    if (err) {
        throw err;
    }
    //console.log(require('util').inspect(data));
    myocr.ocr(data, { lang: 'eng',  }, function(result){
        console.log(result);
    });

});*/



var nodecr = require('node-tesseract/lib/nodecr.js');

console.log(__dirname);
for(var i = 0; i <= 8; i++) {

    nodecr.process(__dirname + '/lets' + i + '.jpg', function(err, text, obj) {
        if(err) {
            console.error(err);
        }
        console.log( obj.i + ' = ' + text);
    }, null, 10, null, null, /*nodecr.preprocessors.convert*/ { 'i': i });

}
// 10 - single character

