var cv = require('cv');

function VideoCapture() {
    this.fName  = '';
    this.fps    = 0;
    this.cntFrm = 0;
    this.videoCap;
}

VideoCapture.prototype.init = function(fNamePath) {
    this.videoCap = cv.captureFromFile(fNamePath);
    this.fName   = fNamePath;
    this.cntFrm  = cv.getCaptureProperty(this.videoCap, cv.CV_CAP_PROP_FRAME_COUNT);
    this.fps     = cv.getCaptureProperty(this.videoCap, cv.CV_CAP_PROP_FPS);
    if (!this.fps) {
        throw new Error("Video not captured from " + fNamePath);
    }
    /*
     videoCap need cvReleaseCapture ... but ... "Segmentation fault" :(
     */
};

VideoCapture.prototype.getFrame = function(pos) {
    cv.setCaptureProperty(this.videoCap, cv.CV_CAP_PROP_POS_FRAMES, pos);
    if (!cv.grabFrame(this.videoCap)) {
        throw new Error("Frame " + pos + " not grab");
    }
    return cv.retrieveFrame(this.videoCap);
    //return cv.queryFrame( this.videoCap );
};

VideoCapture.prototype.saveFrame = function(fNamePath, pos) {
    var frame;
    try {
        frame = this.getFrame(pos);
    } catch (e) {
        console.log(e);
        return false;
    }
    //cv.saveImage(fNamePath + '-' + pos + '.jpg', frame, 0);
    cv.saveImage(fNamePath, frame, 0);
    return fNamePath;
};

module.exports = new VideoCapture();
