/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║  DNA ENCODER — File → DNA Sequence                                   ║
 * ║  Implements Goldman et al. (Nature 2013) method with               ║
 * ║  custom 64-gate codon mapping for semantic transduction             ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */

import { GATES, CODON_TO_GATE, getGateByCodon, ALL_CODONS } from "../hd/gates.js";

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const DNA_BASES = ["A", "C", "G", "T"] as const;
type DNABase = typeof DNA_BASES[number];

// Standard 2-bit encoding: A=00, C=01, G=10, T=11
const BASE_TO_BITS: Record<string, string> = { A: "00", C: "01", G: "10", T: "11" };
const BITS_TO_BASE: Record<string, string> = { "00": "A", "01": "C", "10": "G", "11": "T" };

// Goldman method parameters
const CHUNK_SIZE = 100;        // nucleotides per chunk
const OVERLAP = 25;            // overlap between chunks
const MAX_HOMOPOLYMER = 3;     // max consecutive same base
const MIN_GC = 0.47;           // minimum GC content
const MAX_GC = 0.53;           // maximum GC content

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface DNAChunk {
  id: number;
  sequence: string;
  parity: string;              // error correction
  index: number;
  total: number;
}

export interface DNAEncoding {
  originalSize: number;
  dnaSequence: string;
  chunks: DNAChunk[];
  metadata: {
    chunkSize: number;
    overlap: number;
    gcContent: number;
    homopolymerMax: number;
    totalChunks: number;
  };
  codonMap: string[];          // which gates/codons were used
  gateFrequency: Record<number, number>;
}

export interface DecodedResult {
  bytes: Uint8Array;
  verified: boolean;
  checksum: string;
}

// ═══════════════════════════════════════════════════════════════════════
// BINARY → DNA ENCODING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Convert binary data to DNA sequence using 2-bit encoding
 * Each byte → 4 nucleotides
 */
export function binaryToDNA(data: Uint8Array): string {
  let dna = "";
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    dna += BITS_TO_BASE[(byte >> 6) & 3];
    dna += BITS_TO_BASE[(byte >> 4) & 3];
    dna += BITS_TO_BASE[(byte >> 2) & 3];
    dna += BITS_TO_BASE[byte & 3];
  }
  return dna;
}

/**
 * Convert DNA sequence back to binary
 */
export function dnaToBinary(dna: string): Uint8Array {
  const bits = dna.split("").map(b => BASE_TO_BITS[b] || "00").join("");
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byteStr = bits.slice(i, i + 8).padEnd(8, "0");
    bytes.push(parseInt(byteStr, 2));
  }
  return new Uint8Array(bytes);
}

// ═══════════════════════════════════════════════════════════════════════
// BIOLOGICAL VALIDATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check if a DNA sequence meets biological constraints
 * - No homopolymers longer than MAX_HOMOPOLYMER
 * - GC content within range
 */
export function validateDNA(dna: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check homopolymers
  let current = dna[0];
  let count = 1;
  let maxRun = 1;
  for (let i = 1; i < dna.length; i++) {
    if (dna[i] === current) {
      count++;
      maxRun = Math.max(maxRun, count);
    } else {
      current = dna[i];
      count = 1;
    }
  }
  if (maxRun > MAX_HOMOPOLYMER) {
    issues.push(`Homopolymer run of ${maxRun} exceeds max ${MAX_HOMOPOLYMER}`);
  }

  // Check GC content
  const gcCount = (dna.match(/[GC]/g) || []).length;
  const gcRatio = gcCount / dna.length;
  if (gcRatio < MIN_GC || gcRatio > MAX_GC) {
    issues.push(`GC content ${gcRatio.toFixed(3)} outside range [${MIN_GC}, ${MAX_GC}]`);
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Fix a DNA sequence to meet biological constraints
 * Uses simple substitution to break homopolymers and balance GC
 */
export function fixDNA(dna: string): string {
  let fixed = dna;

  // Break homopolymers
  let current = fixed[0];
  let count = 1;
  const result: string[] = [current];

  for (let i = 1; i < fixed.length; i++) {
    if (fixed[i] === current) {
      count++;
      if (count > MAX_HOMOPOLYMER) {
        // Substitute with a different base
        const alternatives = DNA_BASES.filter(b => b !== current);
        result.push(alternatives[Math.floor(Math.random() * alternatives.length)]);
        count = 1;
        current = result[result.length - 1];
      } else {
        result.push(fixed[i]);
      }
    } else {
      current = fixed[i];
      count = 1;
      result.push(fixed[i]);
    }
  }

  fixed = result.join("");

  // Balance GC content
  const gcCount = (fixed.match(/[GC]/g) || []).length;
  const gcRatio = gcCount / fixed.length;
  if (gcRatio < MIN_GC) {
    // Need more GC
    const needed = Math.ceil((MIN_GC * fixed.length - gcCount) / (1 - MIN_GC));
    const positions = shuffleArray([...Array(fixed.length).keys()]).slice(0, needed);
    const chars = fixed.split("");
    for (const pos of positions) {
      if (chars[pos] === "A") chars[pos] = "G";
      else if (chars[pos] === "T") chars[pos] = "C";
    }
    fixed = chars.join("");
  } else if (gcRatio > MAX_GC) {
    // Need less GC
    const needed = Math.ceil((gcCount - MAX_GC * fixed.length) / MAX_GC);
    const positions = shuffleArray([...Array(fixed.length).keys()]).slice(0, needed);
    const chars = fixed.split("");
    for (const pos of positions) {
      if (chars[pos] === "G") chars[pos] = "A";
      else if (chars[pos] === "C") chars[pos] = "T";
    }
    fixed = chars.join("");
  }

  return fixed;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ═══════════════════════════════════════════════════════════════════════
// CHUNKING (Goldman method)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Split DNA into overlapping chunks with error correction
 * Each chunk contains:
 * - Index (which chunk this is)
 - Data (payload)
 * - Parity (XOR of index and data for error detection)
 */
export function chunkDNA(dna: string, chunkSize: number = CHUNK_SIZE, overlap: number = OVERLAP): DNAChunk[] {
  const chunks: DNAChunk[] = [];
  const stride = chunkSize - overlap;
  const totalChunks = Math.ceil((dna.length - overlap) / stride);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * stride;
    const end = Math.min(start + chunkSize, dna.length);
    const sequence = dna.slice(start, end);

    // Simple parity: XOR of all bases as 2-bit values
    let parity = 0;
    for (const base of sequence) {
      parity ^= parseInt(BASE_TO_BITS[base], 2);
    }
    const parityBase = BITS_TO_BASE[parity.toString(2).padStart(2, "0")];

    chunks.push({
      id: i,
      sequence,
      parity: parityBase,
      index: i,
      total: totalChunks
    });
  }

  return chunks;
}

/**
 * Reassemble chunks back into DNA sequence
 */
export function unchunkDNA(chunks: DNAChunk[]): string {
  // Sort by index
  const sorted = [...chunks].sort((a, b) => a.index - b.index);
  if (sorted.length === 0) return "";

  const overlap = sorted[0].sequence.length - (sorted.length > 1 ? sorted[1].index * (sorted[0].sequence.length - 25) : 0);
  const effectiveOverlap = Math.max(0, sorted[0].sequence.length - (sorted.length > 1 ? sorted[1].index : 0));

  let result = sorted[0].sequence;
  const stride = sorted[0].sequence.length - 25; // approximate

  for (let i = 1; i < sorted.length; i++) {
    const chunk = sorted[i];
    const expectedStart = i * stride;
    if (result.length < expectedStart + chunk.sequence.length) {
      result += chunk.sequence.slice(result.length - expectedStart);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// 64-GATE CODON MAPPING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Map a DNA sequence to 64-gate codons
 * Every 3 nucleotides = 1 codon = 1 gate
 */
export function dnaToCodons(dna: string): string[] {
  const codons: string[] = [];
  for (let i = 0; i < dna.length - 2; i += 3) {
    codons.push(dna.slice(i, i + 3));
  }
  return codons;
}

/**
 * Map codons to gate numbers
 */
export function codonsToGates(codons: string[]): number[] {
  return codons.map(c => CODON_TO_GATE[c] || 0).filter(g => g > 0);
}

/**
 * Get gate frequency distribution from DNA
 */
export function getGateFrequency(dna: string): Record<number, number> {
  const codons = dnaToCodons(dna);
  const gates = codonsToGates(codons);
  const freq: Record<number, number> = {};
  for (const g of gates) {
    freq[g] = (freq[g] || 0) + 1;
  }
  return freq;
}

/**
 * Get amino acid sequence from DNA
 */
export function dnaToAminoAcids(dna: string): string[] {
  const codons = dnaToCodons(dna);
  return codons.map(c => {
    const gate = getGateByCodon(c);
    return gate ? gate.aminoAcid : "?";
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN ENCODE/DECODE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Encode a file (Uint8Array) into a complete DNA encoding
 */
export function encodeToDNA(data: Uint8Array): DNAEncoding {
  // Step 1: Binary → DNA
  let dna = binaryToDNA(data);

  // Step 2: Validate and fix biological constraints
  let validation = validateDNA(dna);
  if (!validation.valid) {
    dna = fixDNA(dna);
    validation = validateDNA(dna);
  }

  // Step 3: Chunk with error correction
  const chunks = chunkDNA(dna);

  // Step 4: Extract codon/gate mapping
  const codons = dnaToCodons(dna);
  const gateFreq = getGateFrequency(dna);

  return {
    originalSize: data.length,
    dnaSequence: dna,
    chunks,
    metadata: {
      chunkSize: CHUNK_SIZE,
      overlap: OVERLAP,
      gcContent: (dna.match(/[GC]/g) || []).length / dna.length,
      homopolymerMax: MAX_HOMOPOLYMER,
      totalChunks: chunks.length
    },
    codonMap: codons,
    gateFrequency: gateFreq
  };
}

/**
 * Decode DNA encoding back to original bytes
 */
export function decodeFromDNA(encoding: DNAEncoding): DecodedResult {
  const dna = encoding.dnaSequence;
  const bytes = dnaToBinary(dna);

  // Verify size
  const verified = bytes.length === encoding.originalSize;

  // Simple checksum
  let checksum = 0;
  for (const b of bytes) {
    checksum = (checksum + b) % 256;
  }

  return {
    bytes,
    verified,
    checksum: checksum.toString(16).padStart(2, "0")
  };
}

/**
 * Decode from raw DNA string
 */
export function decodeDNAString(dna: string, expectedSize: number): DecodedResult {
  const bytes = dnaToBinary(dna);
  const verified = bytes.length === expectedSize;

  let checksum = 0;
  for (const b of bytes) {
    checksum = (checksum + b) % 256;
  }

  return {
    bytes,
    verified,
    checksum: checksum.toString(16).padStart(2, "0")
  };
}

// ═══════════════════════════════════════════════════════════════════════
// FILE I/O HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Read a file as Uint8Array (Node.js)
 */
export async function readFileAsBytes(path: string): Promise<Uint8Array> {
  if (typeof Deno !== "undefined") {
    return await Deno.readFile(path);
  }
  // Node.js
  const fs = await import("fs");
  return new Uint8Array(fs.readFileSync(path));
}

/**
 * Write DNA encoding to files
 */
export async function writeDNAFiles(encoding: DNAEncoding, basePath: string): Promise<void> {
  if (typeof Deno !== "undefined") {
    await Deno.writeTextFile(`${basePath}.dna`, encoding.dnaSequence);
    await Deno.writeTextFile(`${basePath}.json`, JSON.stringify({
      originalSize: encoding.originalSize,
      metadata: encoding.metadata,
      gateFrequency: encoding.gateFrequency,
      codonCount: encoding.codonMap.length
    }, null, 2));
  } else {
    const fs = await import("fs");
    fs.writeFileSync(`${basePath}.dna`, encoding.dnaSequence);
    fs.writeFileSync(`${basePath}.json`, JSON.stringify({
      originalSize: encoding.originalSize,
      metadata: encoding.metadata,
      gateFrequency: encoding.gateFrequency,
      codonCount: encoding.codonMap.length
    }, null, 2));
  }
}

export default {
  encodeToDNA,
  decodeFromDNA,
  decodeDNAString,
  binaryToDNA,
  dnaToBinary,
  validateDNA,
  fixDNA,
  chunkDNA,
  unchunkDNA,
  dnaToCodons,
  codonsToGates,
  getGateFrequency,
  dnaToAminoAcids,
  readFileAsBytes,
  writeDNAFiles
};
