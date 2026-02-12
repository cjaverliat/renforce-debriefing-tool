import {Readable} from 'stream';
import {fromBinary} from '@bufbuild/protobuf';
import {PackedSampleSchema, type PackedSample} from '@proto/plume/sample/packed_sample_pb.js';
import {RecordData} from "@/shared/types/record.ts";

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

function processPackedSamples(_samples: PackedSample[]): RecordData {
    return {
        procedures: [],
        systemMarkers: [],
        tracks: [],
        incidentMarkers: [],
        duration: 0
    };
}

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

    for (const sample of samples.slice(0, 5)) {
        console.log(`  - timestamp: ${sample.timestamp}, payload type: ${sample.payload?.typeUrl}`);
    }
    if (samples.length > 5) {
        console.log(`  ... and ${samples.length - 5} more`);
    }

    return processPackedSamples(samples);
}