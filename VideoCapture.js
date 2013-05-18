var cv = require('cv');

function VideoCapture() {
    this.fName  = '';
    this.fps    = 0;
    this.cntFrm = 0;
}

VideoCapture.prototype.init = function(fNamePath) {
    var videoCap = cv.captureFromFile(fNamePath);
    this.fName   = fNamePath;
    this.cntFrm  = cv.getCaptureProperty(videoCap, cv.CV_CAP_PROP_FRAME_COUNT);
    this.fps     = cv.getCaptureProperty(videoCap, cv.CV_CAP_PROP_FPS);
    if (!this.fps) {
        throw new Error("Video not captured from " + fNamePath);
    }
    /*
     videoCap need cvReleaseCapture ... but ... "Segmentation fault" :(
     */
};

VideoCapture.prototype.getFrame = function(pos) {
    var videoCap = cv.captureFromFile(this.fName);
    cv.setCaptureProperty(videoCap, cv.CV_CAP_PROP_POS_FRAMES, pos);

    if (!cv.grabFrame(videoCap)) {
        throw new Error("Frame " + pos + " not grab");
    }

    return cv.retrieveFrame(videoCap);
    /*
     videoCap need cvReleaseCapture ... but ... "Segmentation fault" :(
     */
    //return cv.queryFrame( videoCap );
};

VideoCapture.prototype.saveFrame = function(fNamePath, pos) {
    var frame;
    try {
        frame = this.getFrame(pos);
    } catch (e) {
        console.log(e);
        return false;
    }
    cv.saveImage(fNamePath, frame, 0);
    return fNamePath;
};

module.exports = new VideoCapture();
