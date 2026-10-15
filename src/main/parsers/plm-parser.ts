/**
 * PLM file parser.
 *
 * A PLM file is a stream of length-prefixed protobuf messages, each of type
 * `PackedSample`. Each `PackedSample` carries a nanosecond timestamp and a
 * `google.protobuf.Any` payload whose type URL identifies the concrete sample
 * type (e.g. `plume.sample.tracking.TrackingSample`).
 *
 * Wire format per message:
 *   [varint: message_byte_length][message_byte_length bytes: PackedSample proto]
 *
 * The parser is streaming: it processes chunks as they arrive from a Node.js
 * Readable stream, carrying over any incomplete frame in a `leftover` buffer.
 *
 * TrackingSamples are converted into procedures, markers and signals following
 * PLM-TRACKING-CSV-FORMAT.md (see `parseTrackingSamples`).
 */
import {Readable} from 'stream';
import {fromBinary} from '@bufbuild/protobuf';
import {PackedSampleSchema, type PackedSample} from '@proto/plume/sample/packed_sample_pb';
import {PhysiologicalSignal, Procedure, ProcedureActionMarker, RecordData} from "@/shared/types/record.ts";
import {TrackingSampleSchema} from "@proto/plume/sample/tracking/tracking_sample_pb";

/**
 * Attempts to decode a protobuf base-128 varint from `buffer` at `offset`.
 *
 * @param buffer     - The buffer to read from.
 * @param offset     - Byte offset at which to start reading.
 * @returns `{ value, bytesRead }` on success, or `null` if the buffer ends
 *          before the varint is complete (caller should wait for more data).
 * @throws  If the varint exceeds 64 bits (malformed data).
 */
function tryReadVarint(buffer: Uint8Array, offset: number): { value: number; bytesRead: number } | null {
    let value = 0;
    let shift = 0;
    let bytesRead = 0;

    while (offset + bytesRead < buffer.length) {
        const byte = buffer[offset + bytesRead];
        value |= (byte & 0x7f) << shift;
        bytesRead++;

        if ((byte & 0x80) === 0) {
            return {value, bytesRead};
        }

        shift += 7;
        if (shift >= 64) {
            throw new Error('Varint too long');
        }
    }

    return null;
}

/**
 * Generator that yields all `PackedSample` messages from a complete byte buffer.
 *
 * Used to flush the leftover buffer after the stream ends, ensuring no trailing
 * messages are dropped. Unlike the streaming loop in `parsePLMFile`, this
 * throws on incomplete frames rather than silently dropping them.
 *
 * @param buffer - A contiguous byte array containing zero or more framed messages.
 */
function* parsePackedSamplesFromBuffer(buffer: Uint8Array): Generator<PackedSample> {
    let offset = 0;

    while (offset < buffer.length) {
        const varintResult = tryReadVarint(buffer, offset);
        if (varintResult === null) {
            throw new Error('Unexpected end of buffer while reading varint');
        }

        const {value: messageSize, bytesRead} = varintResult;
        offset += bytesRead;

        if (offset + messageSize > buffer.length) {
            throw new Error(`Message size ${messageSize} exceeds remaining buffer at offset ${offset}`);
        }

        const messageBytes = buffer.subarray(offset, offset + messageSize);
        yield fromBinary(PackedSampleSchema, messageBytes);

        offset += messageSize;
    }
}

const TRACKING_SAMPLE_TYPE_URL = "type.googleapis.com/plume.sample.tracking.TrackingSample";

type ActionCategory = ProcedureActionMarker['category'];

const ACTION_CATEGORIES: Record<string, ActionCategory> = {
    correct: 'correct_action',
    incorrect: 'incorrect_action',
    timeout: 'timeout_exceeded',
};

/**
 * Joins the remaining CSV fields (descriptions may contain commas).
 * Returns `undefined` when empty.
 */
function rest(fields: string[], from: number): string | undefined {
    const value = fields.slice(from).join(',').trim();
    return value.length > 0 ? value : undefined;
}

/**
 * Converts the `TrackingSample` payloads into procedures, markers and signals,
 * following PLM-TRACKING-CSV-FORMAT.md:
 *
 *   SIGNAL_DECLARE,id,name,unit,sampleRateHz
 *   SIGNAL_DATA,id,value
 *   PROCEDURE_START,id,name
 *   PROCEDURE_END,id
 *   PROCEDURE_ACTION,procedureId,correct|incorrect|timeout,label[,description]
 *   SYSTEM_MARKER,auto|manual,label[,description]
 *   INCIDENT_MARKER,critical|moderate,label[,description]
 *
 * Fields are trimmed. There is no quoting: only the trailing description may
 * contain commas, so a comma in a label starts the description.
 *
 * The event time is `PackedSample.timestamp` (ns) converted to seconds. Rows are
 * applied in timestamp order (file order for equal timestamps), so signal data
 * stays sorted for the renderer's binary searches.
 * Malformed or unknown rows are skipped (and logged) instead of failing the whole file.
 *
 * @param samples - All parsed PackedSample messages from the PLM file.
 */
function parseTrackingSamples(samples: PackedSample[]): Omit<RecordData, 'duration'> {
    const result: Omit<RecordData, 'duration'> = {
        procedures: [],
        systemMarkers: [],
        tracks: [],
        incidentMarkers: [],
    };
    // Running procedure per id (removed on PROCEDURE_END).
    const openProcedures = new Map<string, Procedure>();
    // Procedures opened by a PROCEDURE_ACTION before their PROCEDURE_START.
    const implicitProcedures = new Set<Procedure>();
    const seenProcedureIds = new Set<string>();
    const signals = new Map<string, PhysiologicalSignal>();

    const openProcedure = (id: string, name: string, time: number): Procedure => {
        const procedure: Procedure = {
            id: seenProcedureIds.has(id) ? `${id}#${result.procedures.length}` : id,
            name,
            startTime: time,
            endTime: -1,
            actionMarkers: [],
        };
        seenProcedureIds.add(id);
        openProcedures.set(id, procedure);
        result.procedures.push(procedure);
        return procedure;
    };

    // Array.prototype.sort is stable: rows with equal timestamps keep file order.
    const trackingSamples = samples
        .filter(sample => sample.payload?.typeUrl === TRACKING_SAMPLE_TYPE_URL)
        .sort((a, b) => {
            const ta = a.timestamp ?? 0n;
            const tb = b.timestamp ?? 0n;
            return ta < tb ? -1 : ta > tb ? 1 : 0;
        });
    let skipped = 0;

    for (const sample of trackingSamples) {
        let csv = '';
        try {
            csv = fromBinary(TrackingSampleSchema, sample.payload!.value).csvData ?? '';
            if (sample.timestamp === undefined) throw new Error('missing timestamp');

            const fields = csv.split(',');
            const field = (index: number): string => (fields[index] ?? '').trim();
            const required = (index: number, name: string): string => {
                const value = field(index);
                if (!value) throw new Error(`missing ${name}`);
                return value;
            };
            const eventType = field(0);
            const time = Number(sample.timestamp) / 1e9;

            switch (eventType) {
                case 'SIGNAL_DECLARE': {
                    const id = required(1, 'signal id');
                    // A re-declaration (e.g. sensor reconnect) keeps feeding the existing track.
                    if (signals.has(id)) break;
                    const signal: PhysiologicalSignal = {
                        id,
                        name: field(2) || id,
                        unit: field(3),
                        sampleRate: Number(field(4)) || 0,
                        data: [],
                    };
                    signals.set(id, signal);
                    result.tracks.push(signal);
                    break;
                }
                case 'SIGNAL_DATA': {
                    const signal = signals.get(required(1, 'signal id'));
                    if (!signal) throw new Error('SIGNAL_DATA before SIGNAL_DECLARE');
                    const raw = required(2, 'value');
                    const value = Number(raw);
                    if (!Number.isFinite(value)) throw new Error(`invalid value "${raw}"`);
                    signal.data.push({time, value});
                    break;
                }
                case 'PROCEDURE_START': {
                    const id = required(1, 'procedure id');
                    const name = rest(fields, 2) ?? id;
                    const running = openProcedures.get(id);
                    if (running && implicitProcedures.has(running)) {
                        // Opened implicitly by an earlier action: just name it.
                        running.name = name;
                        implicitProcedures.delete(running);
                    } else {
                        // A previous run that was never ended keeps endTime -1 (lasts until
                        // the end of the record, per the format); this start opens a new run.
                        openProcedure(id, name, time);
                    }
                    break;
                }
                case 'PROCEDURE_END': {
                    const id = required(1, 'procedure id');
                    const procedure = openProcedures.get(id);
                    if (!procedure) throw new Error('PROCEDURE_END without PROCEDURE_START');
                    procedure.endTime = time;
                    openProcedures.delete(id);
                    implicitProcedures.delete(procedure);
                    break;
                }
                case 'PROCEDURE_ACTION': {
                    const id = required(1, 'procedure id');
                    const category = ACTION_CATEGORIES[field(2)];
                    if (!category) throw new Error(`unknown action category "${field(2)}"`);
                    let procedure = openProcedures.get(id);
                    if (!procedure) {
                        procedure = openProcedure(id, id, time);
                        implicitProcedures.add(procedure);
                    }
                    procedure.actionMarkers.push({
                        time,
                        label: field(3),
                        category,
                        description: rest(fields, 4),
                    });
                    break;
                }
                case 'SYSTEM_MARKER':
                    result.systemMarkers.push({
                        time,
                        label: field(2),
                        category: field(1) === 'manual' ? 'manual' : 'automatic',
                        description: rest(fields, 3),
                    });
                    break;
                case 'INCIDENT_MARKER':
                    result.incidentMarkers.push({
                        time,
                        label: field(2),
                        severity: field(1) === 'critical' ? 'critical' : 'moderate',
                        description: rest(fields, 3),
                    });
                    break;
                default:
                    throw new Error(`unknown event type "${eventType}"`);
            }
        } catch (error) {
            skipped++;
            if (skipped <= 20) {
                console.warn(`[PLM] TrackingSample ignored (${(error as Error).message}): ${csv}`);
            }
        }
    }

    const total = trackingSamples.length;
    console.log(`[PLM] TrackingSamples: ${total} read, ${total - skipped} parsed, ${skipped} skipped`);
    return result;
}

/**
 * Converts the full array of parsed `PackedSample` messages into a `RecordData` object.
 *
 * @param samples - All ParsedSample messages from the PLM stream.
 * @returns A `RecordData` with the record duration and the procedures, markers and signals.
 */
function processPackedSamples(samples: PackedSample[]): RecordData {
    const maxTimestampNs = samples.reduce<bigint>(
        (max, s) => (s.timestamp > max ? s.timestamp : max),
        0n
    );

    // Number() keeps the fractional part (bigint division would truncate it).
    const duration = Number(maxTimestampNs) / 1e9;

    return {...parseTrackingSamples(samples), duration};
}

/**
 * Parses a PLM file from a Node.js Readable stream and returns structured record data.
 *
 * The parser reads chunks incrementally, maintaining a `leftover` buffer for
 * incomplete frames that span chunk boundaries. After the stream ends, any
 * remaining bytes in `leftover` are flushed through the buffer parser.
 *
 * @param stream - A Readable stream positioned at the start of the PLM data
 *                 (after LZ4 decompression if applicable).
 * @returns Parsed `RecordData` containing the session duration and all extracted tracks/markers.
 */
export async function parsePLMFile(stream: Readable): Promise<RecordData> {
    const samples: PackedSample[] = [];
    let leftover = new Uint8Array(0);

    for await (const chunk of stream) {
        const value = chunk instanceof Uint8Array ? chunk : Buffer.from(chunk);

        const buffer = new Uint8Array(leftover.length + value.length);
        buffer.set(leftover);
        buffer.set(value, leftover.length);

        let offset = 0;

        while (offset < buffer.length) {
            const varintResult = tryReadVarint(buffer, offset);
            if (varintResult === null) break;

            const {value: messageSize, bytesRead} = varintResult;
            if (offset + bytesRead + messageSize > buffer.length) break;

            const messageBytes = buffer.subarray(offset + bytesRead, offset + bytesRead + messageSize);
            samples.push(fromBinary(PackedSampleSchema, messageBytes));

            offset += bytesRead + messageSize;
        }

        leftover = buffer.subarray(offset);
    }

    if (leftover.length > 0) {
        for (const sample of parsePackedSamplesFromBuffer(leftover)) {
            samples.push(sample);
        }
    }

    console.log(`Parsed ${samples.length} PackedSample messages`);
    return processPackedSamples(samples);
}