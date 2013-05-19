var cvcpp = require('opencv');
var cv     = require('cv');
var fs     = require('fs');

var fname = './port.jpg';

var WHITE = [255, 0, 0];

var fname = './resultZZZ0-0.7962945222388953.jpg';

//var fname = './resultZZZ3-0.6116992610041052.jpg';

var fname = './resultZZZ0-0.10830484237521887.jpg';


var img_l = cv.loadImage(fname, cv.LOAD_IMAGE_UNCHANGED);
var img_2 = cv.loadImage(fname, cv.LOAD_IMAGE_UNCHANGED);


var gray0 = cv.createMat( cv.matSize(img_l).height, cv.matSize(img_l).width, cv.CV_8U);

/*
var smth = parseInt( cv.matSize(img_l).height / 10);
if (smth < 7) {
    smth = 3;
} else {
    smth = 7;
}
*/

smth = 3;
cv.smooth(img_l, img_2, cv.CV_GAUSSIAN, smth, smth);



cv.cvtColor(img_2, gray0, cv.CV_BGR2GRAY);

cv.threshold(gray0, gray0, 150, 250, cv.THRESH_BINARY);

cv.saveImage("./port1.jpg", gray0, 0);

qwe

var radius = 1;
var kern = cv.createStructuringElementEx(radius*2+1, radius*2+1, radius, radius, 1);

var erode = gray0;
var canny = erode;

cv.erode(gray0, erode, kern, 1);
cv.dilate(erode, erode, kern, 1);



if ( cv.matSize(img_l).height < 60 ) {
    erode = resizeImage(erode, 300, 60, 1);
}



cv.saveImage("./port1.jpg", erode, 0);





var bufContour = [], cntrId = [];

cvcpp.readImage('./port1.jpg', function(err, image) {

    var im_process = image.copy();
    im_process.convertGrayscale();

    var bufImgCont = im_process.copy();
    bufImgCont.canny(10, 100);
    bufImgCont.dilate(0);

    //bufImgCont.save('./port2.jpg');

    bufContour[0] = bufImgCont.findContours();

    var bufImgCont = im_process.copy();
    bufImgCont.canny(10, 100);
    bufImgCont.dilate(1);


    //bufImgCont.save('./port3.jpg');

    bufContour[1] = bufImgCont.findContours();

    for(var j = 0; j < bufContour.length; j++) {
        for(var i = 0; i < bufContour[j].size(); i++) {


            bufContour[j].approxPolyDP(i,
                bufContour[j].arcLength(i, true)*0.021, true
            );

            var rec = bufContour[j].boundingRect(i);

            //image.drawContour(bufContour[j], i, WHITE);

            if ( rec.width > 8 && rec.height > 8 && rec.height >= rec.width * 1.1 ) {
                //var bufRec = bufContour[j].minAreaRect(cntrId[i].i);
                cntrId.push({j: j, i: i, x: rec.x, width: rec.width});
            }

        }
    }


    //bufImgCont.save('./port3.jpg');


});

if ( cntrId.length > 0 ) {
    cntrId = sortCntrId(cntrId);
    img_l = cv.loadImage("./port1.jpg", cv.LOAD_IMAGE_UNCHANGED);
    var rects = [];
    for(var i = 0; i < cntrId.length; i++) {

        var rec = bufContour[cntrId[i].j].boundingRect(cntrId[i].i);
        var bufImg = cv.createMat( rec.height + 50, rec.width + 50, cv.getType(img_l));

        cv.setImageROI(img_l, rec);
        cv.copyMakeBorder(img_l, bufImg, {x: 25, y: 25}, cv.IPL_BORDER_CONSTANT, {
            0: 255
        } );

        cv.saveImage("./lets" + i + ".jpg", bufImg, 0);
        cv.resetImageROI(img_l);
    }

}


function sortCntrId( obj ) {
    var i, j, k, objInsFlag;
    var objLock;
    var newObj = [obj[0]];

    for (i = 1; i < obj.length; i++) {
        objInsFlag = false;
        for (j = 0; j < newObj.length; j++ ) {
            if ( obj[i].x <= newObj[j].x ) {
                /* сдвигаем массив вправо и вставляем элемент */
                newObj.splice(j, 0, obj[i]);
                objInsFlag = true;
                break;
            }
        }
        if ( !objInsFlag ) {
            newObj.push(obj[i]);
        }
    }

    objLock = newObj[0];
    objLock.id = 0;
    k = 1;


    do {
        for (j = k; j < newObj.length; j++ ) {

            if ( (objLock.x + objLock.width * 0.65) >= newObj[j].x ) {
            //if ( objLock.x === newObj[j].x ) {
                // объект, выделенные по dilate(0) ( j = 0 ) - имеют приимущество
                if ( newObj[j].j === objLock.j || newObj[j].j ) {
                    newObj.splice(j, 1);
                    break;
                } else {
                    newObj.splice(objLock.id, 1);
                    objLock = newObj[0];
                    objLock.id = 0;
                    k = 1;
                    break;
                }
            } else {
                objLock = newObj[j];
                objLock.id = j;
                k = j+1;
            }
        }
    } while( (k+1) <= newObj.length ) ;

    return newObj;
}






function resizeImage(img, w, h, strict) {
    var ratio = w / h;
    var sizeImg = cv.matSize(img);
    var srcRatio = sizeImg.width / sizeImg.height;

    if ( !strict ) {
        if ( ratio < srcRatio) 	{
            h = parseInt(w / srcRatio);
        } else {
            w = parseInt(h * srcRatio);
        }
    }

    var resImg = cv.createMat(h, w, cv.getType(img));
    cv.resize(img, resImg, cv.CV_INTER_LINEAR);

    return resImg;
}



