var cvcpp = require('opencv');
var cv     = require('cv');
var fs     = require('fs');
var imMag  = require('imagemagick');




var vidCap = require('./VideoCapture');

try {
    var fname = 'vodyatl.mpeg';
    //var fname = 'cut2.mpeg';
    var fname = 'FILE0379.MOV';
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

                    var sides = getABCDLen(
                        rectSideLens(
                            bufContour.point(i, 0),
                            bufContour.point(i, 1),
                            bufContour.point(i, 2),
                            bufContour.point(i, 3)
                        )
                    );

                    if ( !chechRectRatio(
                        (sides[0].len / sides[2].len),
                        (sides[1].len / sides[3].len)
                        )) {
                        continue;
                    }

                    /* удаляем описанный прямоугольник
                     * но надо доделать
                     * если треугольник вписан - описанный удаляем
                     * если треугольник описан - пропускаем
                     * */
                    var inscribedFlag = false;
                    for ( var k = 0; k < cntrId.length; k++ ) {
                        var bufRec = contours[cntrId[k].i].minAreaRect(cntrId[k].j);
                        if (
                            (rec.x >= bufRec.x) &&
                            (rec.x <= (bufRec.x + bufRec.width) ) &&
                            (rec.y <= bufRec.y) &&
                            (rec.y >= (bufRec.y - bufRec.height))
                            ) {
                            cntrId.splice(k, 1);
                            break;
                        } else if ( (bufRec.x >= rec.x) &&
                             (bufRec.x <= (rec.x + rec.width)) &&
                             (bufRec.y <= rec.y) &&
                             (bufRec.y >= (rec.y - rec.height))
                            ) {
                            inscribedFlag = true;
                            break;
                        }
                    }

                    if ( inscribedFlag ) {
                        continue;
                    }

                    cntrId.push({ 'i': IK, 'j': i, 'sides': sides });

                    test.drawContour(bufContour, i, WHITE);

                }
            }

            //test.drawAllContours(bufContour, WHITE);

        }

        test.save('./result.jpg');

    });
    
    
    for ( var i = 0; i < cntrId.length; i++ ) {

        var rect = contours[cntrId[i].i].minAreaRect(cntrId[i].j);

        /*console.log([
            contours[cntrId[i].i].point(cntrId[i].j, 0),
            contours[cntrId[i].i].point(cntrId[i].j, 1),
            contours[cntrId[i].i].point(cntrId[i].j, 2),
            contours[cntrId[i].i].point(cntrId[i].j, 3)
        ]);
        console.log();*/

       // console.log(rect);
       // console.log();

        cntrId[i].sides = sortPoints(cntrId[i].sides);



        /*var srcQuad = { 0: {}, 1: {}, 2: {}, 3: {}};
        srcQuad[0].x = 0;           //src Top left
        srcQuad[0].y = 0;
        srcQuad[1].x = cv.matSize(img_l).width - 1;  //src Top right
        srcQuad[1].y = 0;
        srcQuad[2].x = 0;           //src Bottom left
        srcQuad[2].y = cv.matSize(img_l).height - 1;
        srcQuad[3].x = cv.matSize(img_l).width - 1;  //src Bot right
        srcQuad[3].y = cv.matSize(img_l).height - 1;*/

       /* var dstQuad = { 0: {}, 1: {}, 2: {}, 3: {}};
        dstQuad[0].x = cv.matSize(img_l).width*0.05;  //dst Top left
        dstQuad[0].y = cv.matSize(img_l).height*0.33;
        dstQuad[1].x = cv.matSize(img_l).width*0.9;  //dst Top right
        dstQuad[1].y = cv.matSize(img_l).height*0.25;
        dstQuad[2].x = cv.matSize(img_l).width*0.2;  //dst Bottom left
        dstQuad[2].y = cv.matSize(img_l).height*0.7;
        dstQuad[3].x = cv.matSize(img_l).width*0.8;  //dst Bot right
        dstQuad[3].y = cv.matSize(img_l).height*0.9;*/
/*        var rot_mat = cv.createMat(3, 3, cv.CV_32F);
        var a = cv.createMat(cv.matSize(img_l).height, cv.matSize(img_l).width, cv.getType(img_l));
        var b = cv.createMat(cv.matSize(img_l).height, cv.matSize(img_l).width, cv.getType(img_l));
        var new_mat = cv.createMat(cv.matSize(img_l).height, cv.matSize(img_l).width, cv.getType(img_l));
        //console.log(rot_mat);
        cv.getPerspectiveTransform(a, b, rot_mat);
        cv.warpPerspective(img_l, new_mat, rot_mat);
        */
        /*
        var rot_mat = cv.createMat(3, 3, cv.CV_32FC1);
        var src = [
            { x: cntrId[i].sides[0].a.x, y: cntrId[i].sides[0].a.y },
            { x: cntrId[i].sides[0].a.x, y: cntrId[i].sides[0].a.y },
            { x: cntrId[i].sides[0].a.x, y: cntrId[i].sides[0].a.y },
            { x: cntrId[i].sides[0].a.x, y: cntrId[i].sides[0].a.y },
        ]
        var dst = [
            { x: rect.x, y: rect.y },
            { x: rect.x, y: rect.y },
            { x: rect.x, y: rect.y },
            { x: rect.x, y: rect.y }
        ]
        */

        //var minYDelta = Math.min( cntrId[i].sides      );



        //cv.setImageROI(img_l, contours[cntrId[i].i].boundingRect(cntrId[i].j));
        cv.setImageROI(img_l, rect);

        /*
        var rot_mat = cv.createMat(2, 3, cv.CV_32FC1);
        var new_mat = cv.createMat(cv.matSize(img_l).height, cv.matSize(img_l).width, cv.getType(img_l));
        var center = {x: cv.matSize(img_l).width/2, y: cv.matSize(img_l).height/2};
        cv.cv2DRotationMatrix(center, -60.0, 1, rot_mat);
        cv.warpAffine(img_l, new_mat, rot_mat);
        */
        var fName = "./resultZZZ" + i + '-' + Math.random() + ".jpg";
        cv.saveImage(fName, img_l, 0);


        for ( var j = 0; j < cntrId[i].sides.length; j++ ) {
            cntrId[i].sides[j].a.x -= rect.x;
            cntrId[i].sides[j].b.x -= rect.x;
            cntrId[i].sides[j].a.y -= rect.y;
            cntrId[i].sides[j].b.y -= rect.y;

            var buf = cntrId[i].sides[j];
            switch(j) {
                case 0:
                    /* oldx, oldy, newx, newy */
                    var leftUpPoint = buf.a.x + ',' + buf.a.y + ',0,0';
                    break;
                case 1:
                    var RightUpPoint = buf.b.x + ',' + buf.b.y + ',' + (rect.width-1) + ',0';
                    break;
                case 2:
                    var RightDownPoint = buf.b.x + ',' + buf.b.y + ',' + (rect.width-1) + ',' + (rect.height-1);
                    break;
                case 3:
                    var leftDownPoint = buf.a.x + ',' + buf.a.y + ',0,' + (rect.height-1);
                    break;
            }

        }

        /*
        console.log(cntrId[i].sides);
        console.log();

        console.log(leftUpPoint);
        console.log(RightUpPoint);
        console.log(RightDownPoint);
        console.log(leftDownPoint);
        console.log();
*/



        imMag.convert([fName, '-matte', '-virtual-pixel',  'transparent',
            '-distort', 'Perspective',

            leftUpPoint + ' ' + leftDownPoint + ' ' + RightUpPoint + ' ' + RightDownPoint,

            fName],
            function(err, stdout){
                if (err) throw err;
                //console.log('stdout:', stdout);
        });

        cv.resetImageROI(img_l);

    }

    //cv.saveImage("./resultNEW1.jpg", new_mat, 0);

};


var obj = new CarNum();
var sqrurels = [];


//obj.findSquares('tree.jpg', sqrurels);


//for (var i = 8560; i < vidCap.cntFrm; i += parseInt(vidCap.fps)  ) {
i = 6630;
console.log(i);
    var file = vidCap.saveFrame('./vidfrm.jpg', parseInt(i));
    if ( file !== false ) {
        obj.findSquares(file, sqrurels);
    }

    //if ( i > 3 ) break;
    //vidCap.saveFrame('./vidfrm.jpg', parseInt(i));
    //break;
//}



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
        sides[(i-1)] = {
            'a': {x: arguments[(i-1)].x, y: arguments[(i-1)].y},
            'b': {x: arguments[(i%4)].x, y: arguments[(i%4)].y},
            'len': parseInt(
                Math.sqrt(
                    Math.pow((arguments[(i-1)].x - arguments[i%4].x), 2) +
                    Math.pow((arguments[(i-1)].y - arguments[i%4].y), 2)
                )
             )
        };

    }
    return sides;
}


function getABCDLen( sides ) {

    var a, b, c, d;
    var minI = 0, maxI = 0;

    for ( var i = 1; i < sides.length; i++) {
        if ( sides[minI].len > sides[i].len ) {
            minI = i;
        } else if ( sides[maxI].len < sides[i].len ) {
            maxI = i;
        }
    }
    a = sides[minI];
    b = sides[maxI];

    sides.splice(minI, 1);
    sides.splice(maxI, 1);

    if ( sides[0].len > sides[1].len ) {
        c = sides[1];
        d = sides[0];
    } else {
        c = sides[0];
        d = sides[1];
    }

    return [a, b, c, d];
}

function sortPoints( buf2 ) {
    var buf;
    for ( var i = 0; i < 4; i++ ) {
        if ( !i || i == 2 ) {
            if ( buf2[i].a.y > buf2[i].b.y ) {
                buf         = buf2[i].a;
                buf2[i].a   = buf2[i].b;
                buf2[i].b   = buf;
            }
        } else {
            if ( buf2[i].a.x > buf2[i].b.x ) {
                buf         = buf2[i].a;
                buf2[i].a   = buf2[i].b;
                buf2[i].b   = buf;
            }
        }
    }

    if (buf2[0].a.x > buf2[2].a.x) {
        buf     = buf2[2];
        buf2[2] = buf2[0];
        buf2[0] = buf;
    }

    if (buf2[1].a.y > buf2[3].a.y) {
        buf     = buf2[1];
        buf2[1] = buf2[3];
        buf2[3] = buf;
    }

    return buf2;
}



function chechRectRatio( ab, cd ) {

    if ( ab < 0.9 || ab > 1.1 || cd < 0.9 || ab > 1.1 ) {
        return false;
    }
    return true;
}

