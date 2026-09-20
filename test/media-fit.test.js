const test = require('node:test');
const assert = require('node:assert');

const { fitRect, loopedTime, resizedScale } = require('../src/js/media-fit.js');

test('cover fills the frame, contain fits inside it', () => {
    // 1280x720 into 1920x1080: same 16:9, so both are exactly the frame
    assert.deepStrictEqual(fitRect(1280, 720, 1920, 1080, 'cover'), { width: 1920, height: 1080 });
    assert.deepStrictEqual(fitRect(1280, 720, 1920, 1080, 'contain'), { width: 1920, height: 1080 });

    // 1000x1000 (square) into a 16:9 frame: cover overflows sideways, contain letterboxes
    assert.deepStrictEqual(fitRect(1000, 1000, 1920, 1080, 'cover'), { width: 1920, height: 1920 });
    assert.deepStrictEqual(fitRect(1000, 1000, 1920, 1080, 'contain'), { width: 1080, height: 1080 });

    // blur-bg paints the plate as cover and the clip itself as contain
    assert.deepStrictEqual(fitRect(1000, 1000, 1920, 1080, 'blur-bg'), fitRect(1000, 1000, 1920, 1080, 'contain'));
});

test('a source with no size yet falls back to the frame, not to zero', () => {
    assert.deepStrictEqual(fitRect(0, 0, 1920, 1080, 'cover'), { width: 1920, height: 1080 });
    assert.deepStrictEqual(fitRect(NaN, NaN, 1920, 1080, 'contain'), { width: 1920, height: 1080 });
});

test('source time wraps only past the end of the media', () => {
    assert.strictEqual(loopedTime(3, 6), 3, 'inside the media: untouched');
    assert.strictEqual(loopedTime(6, 6), 0, 'at the end it starts over');
    assert.strictEqual(loopedTime(7.5, 6), 1.5, 'past the end it wraps');
    assert.strictEqual(loopedTime(19, 6), 1);
    assert.strictEqual(loopedTime(4, 0), 4, 'no duration yet: no wrapping');
    assert.strictEqual(loopedTime(4, NaN), 4);
});

test('a corner drag scales around the start distance and stays in slider range', () => {
    assert.strictEqual(resizedScale(1, 100, 200), 2, 'twice as far from the centre = twice the size');
    assert.strictEqual(resizedScale(1, 100, 50), 0.5);
    assert.strictEqual(resizedScale(2, 100, 100), 2, 'no movement, no change');
    assert.strictEqual(resizedScale(1, 100, 1000), 3, 'clamped to the slider maximum');
    assert.strictEqual(resizedScale(1, 100, 1), 0.2, 'clamped to the slider minimum');
    assert.strictEqual(resizedScale(1.5, 0, 200), 1.5, 'degenerate start distance is ignored');
});
