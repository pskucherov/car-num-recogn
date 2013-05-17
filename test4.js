var cvcpp = require('opencv');
var cv     = require('cv');
var fs     = require('fs');


var vidCap = require('./VideoCapture');

try {
    var fname = 'vodyatl.mpeg';
    var fname = 'cut2.mpeg';
    vidCap.init('./' + fname);
} catch(e) {
    console.log(e);
}


var GREEN = [0, 255, 0]; //B, G, R
var WHITE = [255, 255, 255]; //B, G, R


function CarNum() {

}

function delFile( file ) {
    if ( fs.existsSync(file) ) {
        fs.unlinkSync(file);
    }
}

delFile("./buf.jpg");
delFile("./result.jpg");
delFile("./result1.jpg");

CarNum.prototype.findSquares = function (fname, squares) {
    squares = [];

    //console.log(fname);

    /*-- cv start --*/
    var img_l = cv.loadImage(fname, cv.LOAD_IMAGE_UNCHANGED);
    /*
    if ( !cv.matSize(img_l).height || !cv.matSize(img_l).width) {
        return;
    }
    */
    /*-- cv end --*/

    /*-- cvcpp start --*/

    var contours = [], cntrId = [];

    cvcpp.readImage(fname, function(err, image){

        var minThres = 0, maxThres, dilate;
        var bufContour;

        var test = new cvcpp.Matrix(image.height(), image.width());

        var im_process = image.copy();
        im_process.pyrDown();
        im_process.pyrUp();
        im_process.convertGrayscale();

        /*
        im_process.canny(0, 20);
        im_process.dilate(0);
        im_process.save('./result.jpg');
        qwe
        */

        for ( var IK = 0; IK < 20; IK++ ) {

            var im_canny = im_process.copy();

            if ( (IK % 10) < 5 ) {
                maxThres = ((IK % 10) + 1) * 10;
            } else {
                maxThres = ((IK % 10) + 1) * 15;
            }

            if ( IK < 10 ) {
                dilate = 0;
            } else {
                dilate = 2;
            }

            im_canny.canny(maxThres, maxThres);
            im_canny.dilate(dilate);

            //im_canny.save('./Canresult'+maxThres+'-'+ dilate + '.jpg');

            contours[IK] = bufContour = im_canny.findContours();

            //im_canny.save('./result'+maxThres+'-'+ dilate + '.jpg');

            for(var i = 0; i < bufContour.size(); i++) {

                bufContour.approxPolyDP(i,
                    bufContour.arcLength(i, true)*0.021, true
                );

                if( bufContour.cornerCount(i) == 4 &&
                    Math.abs(bufContour.area(i)) > 1000 &&
                    bufContour.isConvex(i) )
                {

                    //test.drawContour(bufContour, i, WHITE);

                    var rec = bufContour.minAreaRect(i);

                    var h = im_canny.size().height;
                    var w = im_canny.size().width;

                    if (rec.height > rec.width) {
                        continue;
                    } else if ( (rec.width / rec.height) < 3 || (rec.width / rec.height) > 7 ) {
                        continue;
                    } else if ( rec.height < 20 ) {
                        continue;
                    }

                    var sidesLen = getABCDLen(rectSideLens(
                        bufContour.point(i, 0),
                        bufContour.point(i, 1),
                        bufContour.point(i, 2),
                        bufContour.point(i, 3)
                    ));

                    if ( !chechRectRatio(
                        (sidesLen[0] / sidesLen[2]),
                        (sidesLen[1] / sidesLen[3])
                        )) {
                        continue;
                    }

                    var inscribedFlag = false;
                    for ( var k = 0; k < cntrId.length; k++ ) {
                        var bufRec = contours[cntrId[k].i].minAreaRect(cntrId[k].j);
                        if (
                            (rec.x >= bufRec.x) &&
                                (rec.y <= bufRec.y) &&
                                (rec.width <= bufRec.width) &&
                                (rec.height <= bufRec.height)
                            ) {

                            inscribedFlag = true;
                            break;
                        }
                    }
                    if ( inscribedFlag ) {
                        continue;
                    }
                    cntrId.push({ 'i': IK, 'j': i });

                    test.drawContour(bufContour, i, WHITE);

                }
            }

            //test.drawAllContours(bufContour, WHITE);

        }

        test.save('./result.jpg');

    });
    
    
    for ( var i = 0; i < cntrId.length; i++ ) {
        cv.setImageROI(img_l, contours[cntrId[i].i].boundingRect(cntrId[i].j));
        cv.saveImage("./resultZZZ" + i + '-' + Math.random() + ".jpg", img_l, 0);
        cv.resetImageROI(img_l);
/*
    var rot_mat = cv.createMat(2, 3, cv.CV_32FC1);
    //var new_mat = cv.createMat(cv.matSize(img_l, cv.matSize(img_l), cv.getType(img_l));
    var center = {x: cv.matSize(img_l).width/2, y: cv.matSize(img_l).height/2};

    console.log(cv.cv2DRotationMatrix(center, -60.0, 1, rot_mat));

    cv.warpAffine(img_l, new_mat, rot_mat);
*/
    }

    //cv.saveImage("./result1.jpg", img_l, 0);

};


var obj = new CarNum();
var sqrurels = [];


//obj.findSquares('tree.jpg', sqrurels);

for (var i = 0; i < vidCap.cntFrm; i += vidCap.fps) {

    var file = vidCap.saveFrame('./vidfrm.jpg', parseInt(i));
    if ( file !== false ) {
        obj.findSquares(file, sqrurels);
    }

    //if ( i > 3 ) break;
    //vidCap.saveFrame('./vidfrm.jpg', parseInt(i));

}



function getAngleABC( a, b, c )
{
    //console.log(arguments);
/*
    var ab = {};
    var ac = {};

    ab.x = b.x - a.x;
    ab.y = b.y - a.y;

    ac.x = b.x - c.x;
    ac.y = b.y - c.y;

    var dotabac = (ab.x * ab.y + ac.x * ac.y);
    var lenab = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
    var lenac = Math.sqrt(ac.x * ac.x + ac.y * ac.y);

    var dacos = dotabac / lenab / lenac;

    //var rslt = Math.acos(dacos);
    //var rs = (rslt * 180) / 3.141592;
    //var rs = rslt;
   // console.log(dacos);
    return (dacos);
    //return Math.cos(rs);*/

    var ab = { x: b.x - a.x, y: b.y - a.y };
    var cb = { x: b.x - c.x, y: b.y - c.y };

    var dot = (ab.x * cb.x + ab.y * cb.y); // dot product
    var cross = (ab.x * cb.y - ab.y * cb.x); // cross product

    var alpha = Math.atan2(cross, dot);

    return Math.cos(alpha * 180. / Math.PI + 0.5).toFixed(1);

}


/*pntsG(
 contours[cntrId[i].i].point(cntrId[i].j,0),
 contours[cntrId[i].i].point(cntrId[i].j,1),
 contours[cntrId[i].i].point(cntrId[i].j,2),
 contours[cntrId[i].i].point(cntrId[i].j,3)
 );*/

function pntsG() {

    console.log(arguments);

    var minX = arguments[0].x;
    var minY = arguments[0].y;
    var maxX = arguments[0].x;
    var maxY = arguments[0].y;

    for(var i = 1; i < arguments.length; i++) {

    }

}


function resizeImage(img, w, h) {

    var ratio = w / h;
    var sizeImg = cv.matSize(img);
    var srcRatio = sizeImg.width / sizeImg.height;

    if (ratio < srcRatio) 	{
        h = w / src_ratio;
    } else {
        w = h * src_ratio;
    }

    var resImg = cv.createMat(h, w, cv.getType(img));
    cv.resize(img, resImg, cv.CV_INTER_LINEAR);

    return resImg;
}

function lenBtwPnts() {
    var minX = arguments[0].x;
    var minY = arguments[0].y;
    var maxX = arguments[0].x;
    var maxY = arguments[0].y;

    for(var i = 1; i < arguments.length; i++) {

        if ( minX > arguments[i].x ) {
            minX = arguments[i].x;
        } else if ( maxX < arguments[i].x ) {
            maxX = arguments[i].x;
        }

        if ( minY > arguments[i].y ) {
            minY = arguments[i].y;
        } else if ( maxY < arguments[i].y ) {
            maxY = arguments[i].y;
        }

    }

    return { x: minX, y: minY, width: (maxX - minX), height: (maxY - minY)};
}

function rectSideLens() {

    var sides = [];

    for ( var i = 1; i < arguments.length + 1; i++) {
        sides[(i-1)] = parseInt(
            Math.sqrt(
                Math.pow((arguments[(i-1)].x - arguments[i%4].x), 2) +
                Math.pow((arguments[(i-1)].y - arguments[i%4].y), 2)
            )
        );

    }
    return sides;
}

function getABCDLen( sides ) {

    var a, b, c, d;

    var minI = 0, maxI = 0;
    for ( var i = 1; i < sides.length; i++) {
        if ( sides[minI] > sides[i] ) {
            minI = i;
        } else if ( sides[maxI] < sides[i] ) {
            maxI = i;
        }
    }
    a = sides[minI];
    b = sides[maxI];

    sides.splice(minI, 1);
    sides.splice(maxI, 1);

    if ( sides[0] > sides[1] ) {
        c = sides[1];
        d = sides[0];
    } else {
        c = sides[0];
        d = sides[1];
    }

    return [a, b, c, d];

}


function chechRectRatio( ab, cd ) {

    if ( ab < 0.9 || ab > 1.1 || cd < 0.9 || ab > 1.1 ) {
        return false;
    }
    return true;
}

