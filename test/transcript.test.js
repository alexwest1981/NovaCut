const test = require('node:test');
const assert = require('node:assert');

const {
    MIN_SEGMENT_SECONDS,
    buildWhisperArgs,
    fileUrlToPath,
    parseTimestamp,
    segmentsFromWhisperResult
} = require('../src/transcript.js');

test('fileUrlToPath decodes file:// URLs and leaves paths alone', () => {
    assert.strictEqual(fileUrlToPath('file:///home/alex/My%20Video/clip.mp4'), '/home/alex/My Video/clip.mp4');
    assert.strictEqual(fileUrlToPath('/home/alex/clip.mp4'), '/home/alex/clip.mp4');
    assert.strictEqual(fileUrlToPath(''), '');
    assert.strictEqual(fileUrlToPath(null), null);
});

test('parseTimestamp reads whisper timestamps and refuses junk', () => {
    assert.strictEqual(parseTimestamp('00:00:01.500'), 1.5);
    assert.strictEqual(parseTimestamp('01:02:03.000'), 3723);
    assert.strictEqual(parseTimestamp('12.5'), 0);
    assert.strictEqual(parseTimestamp(undefined), 0);
});

test('segments come from timestamps or offsets, empties dropped', () => {
    const raw = {
        result: { language: 'sv' },
        transcription: [
            { timestamps: { from: '00:00:01.000', to: '00:00:03.000' }, text: '  hej  ' },
            { offsets: { from: 4000, to: 5500 }, text: 'igen' },
            { timestamps: { from: '00:00:09.000', to: '00:00:09.100' }, text: '   ' }
        ]
    };
    const { language, segments } = segmentsFromWhisperResult(raw, 'en');
    assert.strictEqual(language, 'sv');
    assert.strictEqual(segments.length, 2, 'the whitespace-only segment is dropped');
    assert.deepStrictEqual(segments[0], { text: 'hej', startTime: 1, endTime: 3, duration: 2 });
    assert.deepStrictEqual(segments[1], { text: 'igen', startTime: 4, endTime: 5.5, duration: 1.5 });
});

test('a too-short segment is padded to the readable minimum', () => {
    const raw = { transcription: [{ offsets: { from: 1000, to: 1100 }, text: 'ja' }] };
    const { segments } = segmentsFromWhisperResult(raw, 'sv');
    assert.strictEqual(segments[0].duration, MIN_SEGMENT_SECONDS);
    assert.strictEqual(MIN_SEGMENT_SECONDS, 0.6);
});

test('a missing result object still yields the fallback language', () => {
    assert.deepStrictEqual(segmentsFromWhisperResult(null, 'en'), { language: 'en', segments: [] });
});

test('buildWhisperArgs writes the model, output base and language', () => {
    const args = buildWhisperArgs({
        modelPath: '/app/models/ggml-tiny.bin',
        wavPath: '/tmp/x.wav',
        outBase: '/tmp/x_out',
        language: 'sv',
        maxLen: 32
    });
    assert.deepStrictEqual(args, [
        '-m', '/app/models/ggml-tiny.bin',
        '-f', '/tmp/x.wav',
        '-oj',
        '-of', '/tmp/x_out',
        '-sow',
        '-wt', '0.01',
        '-l', 'sv',
        '-ml', '32'
    ]);
});

test('auto language and no maxLen keep the argument list minimal', () => {
    const args = buildWhisperArgs({ modelPath: 'm', wavPath: 'w', outBase: 'o', language: 'auto', maxLen: 0 });
    assert.deepStrictEqual(args.slice(-2), ['-l', 'auto']);
    assert.ok(!args.includes('-ml'));
});
