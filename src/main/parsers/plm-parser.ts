// PLM file parser using protobuf
import { fromBinary } from '@bufbuild/protobuf';
import { PackedSampleSchema, type PackedSample } from '@proto/plume/sample/packed_sample_pb.js';

/**
 * Read a varint from a buffer at the given offset.
 * Returns the value and the number of bytes consumed.
 */
function readVarint(buffer: Uint8Array, offset: number): { value: number; bytesRead: number } {
  let value = 0;
  let shift = 0;
  let bytesRead = 0;

  while (offset + bytesRead < buffer.length) {
    const byte = buffer[offset + bytesRead];
    value |= (byte & 0x7f) << shift;
    bytesRead++;

    if ((byte & 0x80) === 0) {
      return { value, bytesRead };
    }

    shift += 7;
    if (shift >= 64) {
      throw new Error('Varint too long');
    }
  }

  throw new Error('Unexpected end of buffer while reading varint');
}

/**
 * Parse size-delimited PackedSample messages from a buffer.
 * Each message is prefixed with a varint indicating its size.
 */
function parsePackedSamples(buffer: Uint8Array): PackedSample[] {
  const samples: PackedSample[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    // Read the size prefix (varint)
    const { value: messageSize, bytesRead } = readVarint(buffer, offset);
    offset += bytesRead;

    if (offset + messageSize > buffer.length) {
      throw new Error(`Message size ${messageSize} exceeds remaining buffer at offset ${offset}`);
    }

    // Extract the message bytes and parse
    const messageBytes = buffer.slice(offset, offset + messageSize);
    const sample = fromBinary(PackedSampleSchema, messageBytes);
    samples.push(sample);

    offset += messageSize;
  }

  return samples;
}

/**
 * Process parsed PackedSamples into PLMData structure.
 * TODO: Implement unpacking of payload based on type_url
 */
function processPackedSamples(_samples: PackedSample[]): PLMData {
  // TODO: Unpack each sample's payload based on its type_url
  // Example payload types might include:
  // - plume.sample.RecordMetadata
  // - plume.sample.RecordMetrics
  // - plume.sample.unity.Frame
  // - plume.sample.lsl.LslStream
  // etc.

  // Placeholder: return empty PLMData structure
  return {
    metadata: {
      version: '1.0',
      duration: 0,
      sampleRate: 0,
      recordingDate: new Date(),
    },
    tracks: [],
    media: [],
  };
}

/**
 * Parse a .plm file buffer into PLMData structure.
 * PLM files contain size-delimited PackedSample protobuf messages.
 */
export function parsePLMFile(buffer: Buffer): PLMData {
  const uint8Array = new Uint8Array(buffer);
  const samples = parsePackedSamples(uint8Array);

  console.log(`Parsed ${samples.length} PackedSample messages`);

  // Log sample info for debugging
  for (const sample of samples.slice(0, 5)) {
    console.log(`  - timestamp: ${sample.timestamp}, payload type: ${sample.payload?.typeUrl}`);
  }
  if (samples.length > 5) {
    console.log(`  ... and ${samples.length - 5} more`);
  }

  return processPackedSamples(samples);
}
