// Pure helpers behind the caption pipeline — no electron, no fs, no spawning,
// so they can be tested without a display (test/transcript.test.js).
//
// They live here rather than in main.js because main.js requires electron,
// which cannot be loaded outside the runtime.

// Captions shorter than this flash by unreadably; whisper happily reports
// 0.1s segments for clipped words.
const MIN_SEGMENT_SECONDS = 0.6;

// Which model "Bästa tillgängliga" means when several are present in models/.
// base sits first on purpose: it is the measured sweet spot on this machine
// (11x realtime on CPU, 35x on the GPU) and small was no better on sung Swedish
// while costing ten times the time — bigger models are an explicit choice in the
// captions dialog, not a silent default. tiny is last: it repeats itself on
// Swedish. Anything unlisted (a custom quantisation) is still used if it is all
// there is.
const WHISPER_DEFAULT_ORDER = [
    'ggml-base.bin',
    'ggml-small.bin',
    'ggml-medium.bin',
    'ggml-large-v3.bin',
    'ggml-large-v3-turbo.bin',
    'ggml-tiny.bin'
];

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

/**
 * Model filenames present in models/ -> the one to run, or null when none fit.
 * An explicitly chosen model wins; otherwise the best one for the language.
 * English-only models (`.en.`) cannot transcribe Swedish at all, so they are
 * only auto-selected when English is what was asked for.
 */
function pickModel(names, language, requested) {
    const models = (names || []).filter((name) => typeof name === 'string' && /^ggml-.*\.bin$/.test(name));
    if (models.includes(requested)) {
        return requested;
    }
    // English-only models cannot transcribe Swedish at all, so they are out
    // unless English is what was asked for.
    const eligible = models.filter((name) => language === 'en' || !name.includes('.en.'));
    for (const wanted of WHISPER_DEFAULT_ORDER) {
        const englishTwin = wanted.replace(/\.bin$/, '.en.bin');
        if (language === 'en' && eligible.includes(englishTwin)) {
            return englishTwin;
        }
        if (eligible.includes(wanted)) {
            return wanted;
        }
    }
    return eligible.length > 0 ? eligible.sort()[0] : null;
}

module.exports = {
    MIN_SEGMENT_SECONDS,
    WHISPER_DEFAULT_ORDER,
    buildWhisperArgs,
    fileUrlToPath,
    parseTimestamp,
    pickModel,
    segmentsFromWhisperResult
};
