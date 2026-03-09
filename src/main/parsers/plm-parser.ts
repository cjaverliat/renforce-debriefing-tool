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
 * Current status: physiological signal extraction is not yet implemented.
 * `processPackedSamples` returns an empty `RecordData` (duration only) while
 * tracking sample parsing is work-in-progress.
 */
import {Readable} from 'stream';
import {fromBinary} from '@bufbuild/protobuf';
import {PackedSampleSchema, type PackedSample} from '@proto/plume/sample/packed_sample_pb';
import {RecordData} from "@/shared/types/record.ts";
import {TrackingSampleSchema, type TrackingSample} from "@proto/plume/sample/tracking/tracking_sample_pb";

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

/**
 * Extracts and parses `TrackingSample` payloads from the full set of `PackedSample` messages.
 *
 * TrackingSamples encode instructor/application events as CSV strings with the format:
 *   timestamp, ticksSince1970(100ns), ActionName, ActionType, NbParam,
 *   Param1…Param10, Description
 *
 * @param _samples - All parsed PackedSample messages from the PLM file.
 * @returns Parsed TrackingSample objects (currently returns empty array — WIP).
 */
function parseTrackingSamples(_samples: PackedSample[]): TrackingSample[] {

    const packedTrackingSamples = _samples.filter(s => s.payload.typeUrl === "type.googleapis.com/plume.sample.tracking.TrackingSample");

    for (const packedTrackingSample of packedTrackingSamples) {
        const payloadBytes = packedTrackingSample.payload.value;
        const trackingSample = fromBinary(TrackingSampleSchema, payloadBytes);
        const csvData = trackingSample.csvData.split(",");

        // timestamp,ticksSince1970(100ns),ActionName,ActionType,NbParam,Param1,Param2,Param3,Param4,Param5,Param6,Param7,Param8,Param9,Param10,Description
        const timestamp = Number(csvData[0]);
        const ticks = BigInt(csvData[1]);
        const actionName = csvData[2];
        const actionType = csvData[3];
        const nbParams = Number(csvData[4]);
        const params = csvData.slice(5, 5 + nbParams);
        const description = csvData[5 + nbParams];

        // console.log(actionName, actionType);
    }

    return [];
}

/**
 * Converts the full array of parsed `PackedSample` messages into a `RecordData` object.
 *
 * Currently computes the session duration from the maximum sample timestamp and
 * returns empty arrays for all track/marker types while full extraction is pending.
 *
 * @param _samples - All ParsedSample messages from the PLM stream.
 * @returns A `RecordData` with `duration` set and empty tracks/markers.
 */
function processPackedSamples(_samples: PackedSample[]): RecordData {

    const maxTimestampNs = _samples.reduce<bigint>(
        (max, s) => (s.timestamp > max ? s.timestamp : max),
        0n
    );

    const seconds = maxTimestampNs / 1_000_000_000n;
    const remainderNs = maxTimestampNs % 1_000_000_000n;

    const duration = Number(seconds) + Number(remainderNs / 1_000_000_000n);

    const trackingSamples = parseTrackingSamples(_samples);

    return {
        procedures: [],
        systemMarkers: [],
        tracks: [],
        incidentMarkers: [],
        duration: duration
    };
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