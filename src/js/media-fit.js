// Pure geometry for the canvas: how a clip's media is fitted into the frame, how
// a clip's source time wraps when it is longer than its media, and how a corner
// drag turns into a scale. No DOM, no ctx, so test/media-fit.test.js can run it.
//
// The renderer loads this as a plain script (window.NovaCutFit); node requires it.
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.NovaCutFit = api;
    }
})(typeof window !== 'undefined' ? window : null, function () {
    /**
     * The drawn size of a source inside the canvas, before clip scale.
     * cover fills the frame and may overflow; contain fits inside; blur-bg draws
     * the blurred plate as cover and the sharp image as contain.
     */
    function fitRect(srcW, srcH, canvasW, canvasH, mode) {
        const aspect = (srcW > 0 && srcH > 0) ? srcW / srcH : canvasW / canvasH;
        let width = canvasW;
        let height = canvasW / aspect;
        const insideFrame = mode === 'contain' || mode === 'blur-bg';
        if (insideFrame ? height > canvasH : height < canvasH) {
            height = canvasH;
            width = canvasH * aspect;
        }
        return { width, height };
    }

    /** Source time for a clip shorter than its media; wraps when it is longer. */
    function loopedTime(time, mediaDuration) {
        if (!(mediaDuration > 0) || !(time >= mediaDuration)) {
            return time;
        }
        return time % mediaDuration;
    }

    /** Corner drag -> scale, measured from the clip centre. Range matches the
     *  inspector's scale slider (0.2-3.0) so the two never disagree. */
    function resizedScale(startScale, startDistance, currentDistance, min = 0.2, max = 3) {
        if (!(startDistance > 0)) {
            return startScale;
        }
        const next = startScale * (currentDistance / startDistance);
        return Math.max(min, Math.min(max, next));
    }

    return { fitRect, loopedTime, resizedScale };
});
