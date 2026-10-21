/**
 * SYNTHIA COAT v1.0
 * Cryptographic membrane, provenance, lineage, capability declaration, and quarantine policy.
 *
 * A Coat does not decide what an artifact *is* before inspection. The caller first interrogates
 * the artifact, then supplies the resulting manifest/address here. The Coat preserves that result,
 * the original content hash, lineage, signer identity, and mutation history.
 */

import * as crypto from "crypto";

export type CoatDecision = "allow" | "quarantine" | "reject";

export interface CanonicalAddress {
  dimension: "Movement" | "Evolution" | "Being" | "Design" | "Space";
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
  degree?: number;
  minute?: number;
  second?: number;
  arcAxis?: string;
  zodiac?: string;
  house?: number;
  planetary?: string;
}

export interface CoatManifest {
  artifactId: string;
  source: string;
  artifactType: string;
  size: number;
  createdAt: number;
  interrogatedAt: number;
  address?: CanonicalAddress;
  runtime: string[];
  dependencies: string[];
  capabilities: string[];
  permissions: string[];
  gaps: string[];
  provenance: string[];
  metadata?: Record<string, unknown>;
}

export interface CoatMutationRecord {
  id: string;
  timestamp: number;
  reason: string;
  parentContentHash: string;
  childContentHash: string;
  authorKeyId: string;
  tested: boolean;
  fitness: number;
  evidence: string[];
}

export interface CoatEnvelope {
  version: "synthia-coat/1";
  coatId: string;
  coatHash: string;
  contentHash: string;
  manifestHash: string;
  parentCoatHash: string | null;
  signerKeyId: string;
  signerPublicKey: string;
  signature: string;
  membrane: string;
  integrity: number;
  mutationDepth: number;
  createdAt: number;
  manifest: CoatManifest;
  mutations: CoatMutationRecord[];
}

export interface CoatVerification {
  valid: boolean;
  signatureValid: boolean;
  contentValid: boolean;
  manifestValid: boolean;
  coatHashValid: boolean;
  trustedSigner: boolean;
  reasons: string[];
}

export interface CoatPolicy {
  minIntegrity: number;
  maxMutationDepth: number;
  requireTrustedSigner: boolean;
  allowedCapabilities?: string[];
  deniedPermissions?: string[];
}

export interface CoatAssessment {
  decision: CoatDecision;
  verification: CoatVerification;
  reasons: string[];
}

export interface SignedTransfer<T = unknown> {
  version: "synthia-transfer/1";
  transferId: string;
  senderKeyId: string;
  senderPublicKey: string;
  recipientKeyId: string | null;
  createdAt: number;
  payloadHash: string;
  payload: T;
  coat: CoatEnvelope;
  signature: string;
}

function bytes(value: Buffer | string): Buffer {
  return Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
}

export function sha256(value: Buffer | string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function stableStringify(value: unknown): string {
  const active = new WeakSet<object>();
  const normalize = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (Buffer.isBuffer(v)) return { $buffer: v.toString("base64") };
    if (ArrayBuffer.isView(v)) return Array.from(v as any);
    if (active.has(v)) throw new TypeError("Cannot stableStringify circular structure");
    active.add(v);
    try {
      if (Array.isArray(v)) return v.map(normalize);
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(v).sort()) out[key] = normalize(v[key]);
      return out;
    } finally {
      active.delete(v);
    }
  };
  return JSON.stringify(normalize(value));
}

function coatUnsignedBody(coat: Omit<CoatEnvelope, "signature" | "coatHash">): string {
  return stableStringify(coat);
}

function transferUnsignedBody<T>(transfer: Omit<SignedTransfer<T>, "signature">): string {
  return stableStringify(transfer);
}

export class CoatAuthority {
  public readonly publicKeyPem: string;
  public readonly keyId: string;
  private readonly privateKeyPem: string;

  constructor(keys?: { publicKeyPem: string; privateKeyPem: string }) {
    if (keys) {
      this.publicKeyPem = keys.publicKeyPem;
      this.privateKeyPem = keys.privateKeyPem;
    } else {
      const pair = crypto.generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      this.publicKeyPem = pair.publicKey;
      this.privateKeyPem = pair.privateKey;
    }
    this.keyId = sha256(this.publicKeyPem).slice(0, 24);
  }

  exportKeys(): { publicKeyPem: string; privateKeyPem: string; keyId: string } {
    return { publicKeyPem: this.publicKeyPem, privateKeyPem: this.privateKeyPem, keyId: this.keyId };
  }

  createCoat(
    content: Buffer | string,
    manifest: CoatManifest,
    parent: CoatEnvelope | null = null,
    mutations: CoatMutationRecord[] = [],
    integrity = 1,
  ): CoatEnvelope {
    const contentHash = sha256(bytes(content));
    const manifestHash = sha256(stableStringify(manifest));
    const createdAt = Date.now();
    const unsigned: Omit<CoatEnvelope, "signature" | "coatHash"> = {
      version: "synthia-coat/1",
      coatId: crypto.randomUUID(),
      contentHash,
      manifestHash,
      parentCoatHash: parent?.coatHash ?? null,
      signerKeyId: this.keyId,
      signerPublicKey: this.publicKeyPem,
      membrane: this.makeMembrane(manifest, contentHash, mutations.length, integrity),
      integrity: clamp01(integrity),
      mutationDepth: parent ? parent.mutationDepth + 1 : 0,
      createdAt,
      manifest,
      mutations: [...mutations],
    };
    const body = coatUnsignedBody(unsigned);
    const signature = crypto.sign(null, Buffer.from(body), this.privateKeyPem).toString("base64");
    const coatHash = sha256(body + signature);
    return { ...unsigned, signature, coatHash };
  }

  mutateCoat(
    parent: CoatEnvelope,
    oldContent: Buffer | string,
    newContent: Buffer | string,
    manifest: CoatManifest,
    reason: string,
    evidence: string[],
    tested: boolean,
    fitness: number,
  ): CoatEnvelope {
    const mutation: CoatMutationRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      reason,
      parentContentHash: sha256(bytes(oldContent)),
      childContentHash: sha256(bytes(newContent)),
      authorKeyId: this.keyId,
      tested,
      fitness: clamp01(fitness),
      evidence: [...evidence],
    };
    return this.createCoat(
      newContent,
      manifest,
      parent,
      [...parent.mutations, mutation],
      tested ? Math.min(parent.integrity, clamp01(fitness)) : Math.min(parent.integrity, 0.5),
    );
  }

  createTransfer<T>(payload: T, coat: CoatEnvelope, recipientKeyId: string | null = null): SignedTransfer<T> {
    const unsigned: Omit<SignedTransfer<T>, "signature"> = {
      version: "synthia-transfer/1",
      transferId: crypto.randomUUID(),
      senderKeyId: this.keyId,
      senderPublicKey: this.publicKeyPem,
      recipientKeyId,
      createdAt: Date.now(),
      payloadHash: sha256(stableStringify(payload)),
      payload,
      coat,
    };
    const signature = crypto.sign(null, Buffer.from(transferUnsignedBody(unsigned)), this.privateKeyPem).toString("base64");
    return { ...unsigned, signature };
  }

  private makeMembrane(manifest: CoatManifest, contentHash: string, mutations: number, integrity: number): string {
    const address = manifest.address
      ? `${manifest.address.dimension}:G${manifest.address.gate}.L${manifest.address.line}.C${manifest.address.color}.T${manifest.address.tone}.B${manifest.address.base}`
      : "unaddressed";
    return `coat://${this.keyId}/${manifest.artifactType}/${address}/sha256:${contentHash.slice(0, 16)}/m:${mutations}/i:${clamp01(integrity).toFixed(3)}`;
  }
}

export class CoatVerifier {
  constructor(private readonly trustedKeyIds: Set<string> = new Set()) {}

  trust(keyId: string): void { this.trustedKeyIds.add(keyId); }
  distrust(keyId: string): void { this.trustedKeyIds.delete(keyId); }

  verify(content: Buffer | string, coat: CoatEnvelope): CoatVerification {
    const reasons: string[] = [];
    const contentValid = sha256(bytes(content)) === coat.contentHash;
    if (!contentValid) reasons.push("content_hash_mismatch");

    const manifestValid = sha256(stableStringify(coat.manifest)) === coat.manifestHash;
    if (!manifestValid) reasons.push("manifest_hash_mismatch");

    const unsigned: Omit<CoatEnvelope, "signature" | "coatHash"> = {
      version: coat.version,
      coatId: coat.coatId,
      contentHash: coat.contentHash,
      manifestHash: coat.manifestHash,
      parentCoatHash: coat.parentCoatHash,
      signerKeyId: coat.signerKeyId,
      signerPublicKey: coat.signerPublicKey,
      membrane: coat.membrane,
      integrity: coat.integrity,
      mutationDepth: coat.mutationDepth,
      createdAt: coat.createdAt,
      manifest: coat.manifest,
      mutations: coat.mutations,
    };
    const body = coatUnsignedBody(unsigned);
    let signatureValid = false;
    try {
      signatureValid = crypto.verify(null, Buffer.from(body), coat.signerPublicKey, Buffer.from(coat.signature, "base64"));
    } catch {
      signatureValid = false;
    }
    if (!signatureValid) reasons.push("signature_invalid");

    const expectedKeyId = sha256(coat.signerPublicKey).slice(0, 24);
    if (expectedKeyId !== coat.signerKeyId) reasons.push("signer_key_id_mismatch");

    const coatHashValid = sha256(body + coat.signature) === coat.coatHash;
    if (!coatHashValid) reasons.push("coat_hash_mismatch");

    const trustedSigner = this.trustedKeyIds.has(coat.signerKeyId);
    return {
      valid: contentValid && manifestValid && signatureValid && coatHashValid && expectedKeyId === coat.signerKeyId,
      signatureValid,
      contentValid,
      manifestValid,
      coatHashValid,
      trustedSigner,
      reasons,
    };
  }

  verifyTransfer<T>(transfer: SignedTransfer<T>): CoatVerification & { payloadValid: boolean; recipientValid: boolean } {
    const reasons: string[] = [];
    const payloadValid = sha256(stableStringify(transfer.payload)) === transfer.payloadHash;
    if (!payloadValid) reasons.push("transfer_payload_hash_mismatch");
    const expectedKeyId = sha256(transfer.senderPublicKey).slice(0, 24);
    let signatureValid = false;
    const unsigned: Omit<SignedTransfer<T>, "signature"> = { ...transfer };
    delete (unsigned as any).signature;
    try {
      signatureValid = crypto.verify(
        null,
        Buffer.from(transferUnsignedBody(unsigned)),
        transfer.senderPublicKey,
        Buffer.from(transfer.signature, "base64"),
      );
    } catch {
      signatureValid = false;
    }
    if (!signatureValid) reasons.push("transfer_signature_invalid");
    if (expectedKeyId !== transfer.senderKeyId) reasons.push("transfer_sender_key_id_mismatch");
    const trustedSigner = this.trustedKeyIds.has(transfer.senderKeyId);
    return {
      valid: payloadValid && signatureValid && expectedKeyId === transfer.senderKeyId,
      signatureValid,
      contentValid: true,
      manifestValid: true,
      coatHashValid: true,
      trustedSigner,
      payloadValid,
      recipientValid: true,
      reasons,
    };
  }

  assess(content: Buffer | string, coat: CoatEnvelope, policy: CoatPolicy): CoatAssessment {
    const verification = this.verify(content, coat);
    const reasons = [...verification.reasons];
    let decision: CoatDecision = "allow";

    if (!verification.valid) decision = "reject";
    if (coat.integrity < policy.minIntegrity) {
      reasons.push(`integrity_below_${policy.minIntegrity}`);
      decision = "quarantine";
    }
    if (coat.mutationDepth > policy.maxMutationDepth) {
      reasons.push(`mutation_depth_above_${policy.maxMutationDepth}`);
      decision = "quarantine";
    }
    if (policy.requireTrustedSigner && !verification.trustedSigner) {
      reasons.push("signer_not_trusted");
      decision = "quarantine";
    }
    if (policy.allowedCapabilities) {
      const denied = coat.manifest.capabilities.filter(c => !policy.allowedCapabilities!.includes(c));
      if (denied.length) {
        reasons.push(`capability_not_allowed:${denied.join(",")}`);
        decision = "quarantine";
      }
    }
    if (policy.deniedPermissions) {
      const denied = coat.manifest.permissions.filter(p => policy.deniedPermissions!.includes(p));
      if (denied.length) {
        reasons.push(`permission_denied:${denied.join(",")}`);
        decision = "reject";
      }
    }
    return { decision, verification, reasons };
  }
}

export class CoatLedger {
  private readonly byHash = new Map<string, CoatEnvelope>();

  append(coat: CoatEnvelope): void {
    if (coat.parentCoatHash && !this.byHash.has(coat.parentCoatHash)) {
      throw new Error(`Unknown parent coat: ${coat.parentCoatHash}`);
    }
    this.byHash.set(coat.coatHash, coat);
  }

  get(hash: string): CoatEnvelope | undefined { return this.byHash.get(hash); }

  lineage(hash: string): CoatEnvelope[] {
    const chain: CoatEnvelope[] = [];
    const seen = new Set<string>();
    let current = this.byHash.get(hash);
    while (current) {
      if (seen.has(current.coatHash)) throw new Error("Coat lineage cycle detected");
      seen.add(current.coatHash);
      chain.push(current);
      current = current.parentCoatHash ? this.byHash.get(current.parentCoatHash) : undefined;
    }
    return chain;
  }

  verifyLineage(hash: string): { valid: boolean; reasons: string[] } {
    const chain = this.lineage(hash);
    const reasons: string[] = [];
    for (let i = 0; i < chain.length - 1; i++) {
      if (chain[i].parentCoatHash !== chain[i + 1].coatHash) reasons.push(`broken_parent_link:${chain[i].coatHash}`);
      if (chain[i].mutationDepth !== chain[i + 1].mutationDepth + 1) reasons.push(`bad_mutation_depth:${chain[i].coatHash}`);
    }
    return { valid: reasons.length === 0, reasons };
  }
}

export const DEFAULT_COAT_POLICY: CoatPolicy = {
  minIntegrity: 0.65,
  maxMutationDepth: 256,
  requireTrustedSigner: false,
  deniedPermissions: ["arbitrary_network", "outside_workspace_write", "credential_access", "autonomous_replication"],
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
