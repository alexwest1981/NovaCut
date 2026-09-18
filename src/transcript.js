// Pure helpers behind the caption pipeline — no electron, no fs, no spawning,
// so they can be tested without a display (test/transcript.test.js).
//
// They live here rather than in main.js because main.js requires electron,
// which cannot be loaded outside the runtime.

// Captions shorter than this flash by unreadably; whisper happily reports
// 0.1s segments for clipped words.
const MIN_SEGMENT_SECONDS = 0.6;

/** file:// URL or plain path -> filesystem path. */
function fileUrlToPath(value) {
    if (typeof value !== 'string' || !value.startsWith('file://')) {
        return value;
    }
    return decodeURIComponent(value.replace('file://', ''));
}

/** whisper-cli timestamp ("HH:MM:SS.mmm") -> seconds; anything else -> 0. */
function parseTimestamp(ts) {
    if (typeof ts !== 'string') {
        return 0;
    }
    const parts = ts.split(':');
    if (parts.length !== 3) {
        return 0;
    }
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
}

/**
 * whisper-cli's JSON output -> { language, segments }.
 * Segments carry either `timestamps` (HH:MM:SS.mmm) or `offsets` (milliseconds).
 * Empty segments are dropped: they render as invisible caption boxes.
 */
function segmentsFromWhisperResult(rawResult, fallbackLanguage) {
    const language = (rawResult && rawResult.result && rawResult.result.language) || fallbackLanguage;
    const segments = ((rawResult && rawResult.transcription) || [])
        .map((seg) => {
            let startSec = 0;
            let endSec = 0;
            if (seg.timestamps && seg.timestamps.from && seg.timestamps.to) {
                startSec = parseTimestamp(seg.timestamps.from);
                endSec = parseTimestamp(seg.timestamps.to);
            } else if (seg.offsets) {
                startSec = (seg.offsets.from || 0) / 1000;
                endSec = (seg.offsets.to || 0) / 1000;
            }
            return {
                text: (seg.text || '').trim(),
                startTime: startSec,
                endTime: endSec,
                duration: Math.max(MIN_SEGMENT_SECONDS, endSec - startSec)
            };
        })
        .filter((s) => s.text.length > 0);
    return { language, segments };
}

/** The whisper-cli command line for one prepared 16 kHz mono WAV. */
function buildWhisperArgs({ modelPath, wavPath, outBase, language, maxLen }) {
    const args = [
        '-m', modelPath,
        '-f', wavPath,
        '-oj',
        '-of', outBase,
        '-sow',
        '-wt', '0.01'
    ];
    args.push('-l', language && language !== 'auto' ? language : 'auto');
    if (maxLen && maxLen > 0) {
        args.push('-ml', maxLen.toString());
    }
    return args;
}

module.exports = {
    MIN_SEGMENT_SECONDS,
    buildWhisperArgs,
    fileUrlToPath,
    parseTimestamp,
    segmentsFromWhisperResult
};
