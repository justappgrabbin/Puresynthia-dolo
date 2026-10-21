"use strict";
/**
 * SYNTHIA COAT v1.0
 * Cryptographic membrane, provenance, lineage, capability declaration, and quarantine policy.
 *
 * A Coat does not decide what an artifact *is* before inspection. The caller first interrogates
 * the artifact, then supplies the resulting manifest/address here. The Coat preserves that result,
 * the original content hash, lineage, signer identity, and mutation history.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COAT_POLICY = exports.CoatLedger = exports.CoatVerifier = exports.CoatAuthority = void 0;
exports.sha256 = sha256;
exports.stableStringify = stableStringify;
const crypto = __importStar(require("crypto"));
function bytes(value) {
    return Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
}
function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}
function stableStringify(value) {
    const active = new WeakSet();
    const normalize = (v) => {
        if (v === null || typeof v !== "object")
            return v;
        if (Buffer.isBuffer(v))
            return { $buffer: v.toString("base64") };
        if (ArrayBuffer.isView(v))
            return Array.from(v);
        if (active.has(v))
            throw new TypeError("Cannot stableStringify circular structure");
        active.add(v);
        try {
            if (Array.isArray(v))
                return v.map(normalize);
            const out = {};
            for (const key of Object.keys(v).sort())
                out[key] = normalize(v[key]);
            return out;
        }
        finally {
            active.delete(v);
        }
    };
    return JSON.stringify(normalize(value));
}
function coatUnsignedBody(coat) {
    return stableStringify(coat);
}
function transferUnsignedBody(transfer) {
    return stableStringify(transfer);
}
class CoatAuthority {
    constructor(keys) {
        if (keys) {
            this.publicKeyPem = keys.publicKeyPem;
            this.privateKeyPem = keys.privateKeyPem;
        }
        else {
            const pair = crypto.generateKeyPairSync("ed25519", {
                publicKeyEncoding: { type: "spki", format: "pem" },
                privateKeyEncoding: { type: "pkcs8", format: "pem" },
            });
            this.publicKeyPem = pair.publicKey;
            this.privateKeyPem = pair.privateKey;
        }
        this.keyId = sha256(this.publicKeyPem).slice(0, 24);
    }
    exportKeys() {
        return { publicKeyPem: this.publicKeyPem, privateKeyPem: this.privateKeyPem, keyId: this.keyId };
    }
    createCoat(content, manifest, parent = null, mutations = [], integrity = 1) {
        const contentHash = sha256(bytes(content));
        const manifestHash = sha256(stableStringify(manifest));
        const createdAt = Date.now();
        const unsigned = {
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
    mutateCoat(parent, oldContent, newContent, manifest, reason, evidence, tested, fitness) {
        const mutation = {
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
        return this.createCoat(newContent, manifest, parent, [...parent.mutations, mutation], tested ? Math.min(parent.integrity, clamp01(fitness)) : Math.min(parent.integrity, 0.5));
    }
    createTransfer(payload, coat, recipientKeyId = null) {
        const unsigned = {
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
    makeMembrane(manifest, contentHash, mutations, integrity) {
        const address = manifest.address
            ? `${manifest.address.dimension}:G${manifest.address.gate}.L${manifest.address.line}.C${manifest.address.color}.T${manifest.address.tone}.B${manifest.address.base}`
            : "unaddressed";
        return `coat://${this.keyId}/${manifest.artifactType}/${address}/sha256:${contentHash.slice(0, 16)}/m:${mutations}/i:${clamp01(integrity).toFixed(3)}`;
    }
}
exports.CoatAuthority = CoatAuthority;
class CoatVerifier {
    constructor(trustedKeyIds = new Set()) {
        this.trustedKeyIds = trustedKeyIds;
    }
    trust(keyId) { this.trustedKeyIds.add(keyId); }
    distrust(keyId) { this.trustedKeyIds.delete(keyId); }
    verify(content, coat) {
        const reasons = [];
        const contentValid = sha256(bytes(content)) === coat.contentHash;
        if (!contentValid)
            reasons.push("content_hash_mismatch");
        const manifestValid = sha256(stableStringify(coat.manifest)) === coat.manifestHash;
        if (!manifestValid)
            reasons.push("manifest_hash_mismatch");
        const unsigned = {
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
        }
        catch {
            signatureValid = false;
        }
        if (!signatureValid)
            reasons.push("signature_invalid");
        const expectedKeyId = sha256(coat.signerPublicKey).slice(0, 24);
        if (expectedKeyId !== coat.signerKeyId)
            reasons.push("signer_key_id_mismatch");
        const coatHashValid = sha256(body + coat.signature) === coat.coatHash;
        if (!coatHashValid)
            reasons.push("coat_hash_mismatch");
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
    verifyTransfer(transfer) {
        const reasons = [];
        const payloadValid = sha256(stableStringify(transfer.payload)) === transfer.payloadHash;
        if (!payloadValid)
            reasons.push("transfer_payload_hash_mismatch");
        const expectedKeyId = sha256(transfer.senderPublicKey).slice(0, 24);
        let signatureValid = false;
        const unsigned = { ...transfer };
        delete unsigned.signature;
        try {
            signatureValid = crypto.verify(null, Buffer.from(transferUnsignedBody(unsigned)), transfer.senderPublicKey, Buffer.from(transfer.signature, "base64"));
        }
        catch {
            signatureValid = false;
        }
        if (!signatureValid)
            reasons.push("transfer_signature_invalid");
        if (expectedKeyId !== transfer.senderKeyId)
            reasons.push("transfer_sender_key_id_mismatch");
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
    assess(content, coat, policy) {
        const verification = this.verify(content, coat);
        const reasons = [...verification.reasons];
        let decision = "allow";
        if (!verification.valid)
            decision = "reject";
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
            const denied = coat.manifest.capabilities.filter(c => !policy.allowedCapabilities.includes(c));
            if (denied.length) {
                reasons.push(`capability_not_allowed:${denied.join(",")}`);
                decision = "quarantine";
            }
        }
        if (policy.deniedPermissions) {
            const denied = coat.manifest.permissions.filter(p => policy.deniedPermissions.includes(p));
            if (denied.length) {
                reasons.push(`permission_denied:${denied.join(",")}`);
                decision = "reject";
            }
        }
        return { decision, verification, reasons };
    }
}
exports.CoatVerifier = CoatVerifier;
class CoatLedger {
    constructor() {
        this.byHash = new Map();
    }
    append(coat) {
        if (coat.parentCoatHash && !this.byHash.has(coat.parentCoatHash)) {
            throw new Error(`Unknown parent coat: ${coat.parentCoatHash}`);
        }
        this.byHash.set(coat.coatHash, coat);
    }
    get(hash) { return this.byHash.get(hash); }
    lineage(hash) {
        const chain = [];
        const seen = new Set();
        let current = this.byHash.get(hash);
        while (current) {
            if (seen.has(current.coatHash))
                throw new Error("Coat lineage cycle detected");
            seen.add(current.coatHash);
            chain.push(current);
            current = current.parentCoatHash ? this.byHash.get(current.parentCoatHash) : undefined;
        }
        return chain;
    }
    verifyLineage(hash) {
        const chain = this.lineage(hash);
        const reasons = [];
        for (let i = 0; i < chain.length - 1; i++) {
            if (chain[i].parentCoatHash !== chain[i + 1].coatHash)
                reasons.push(`broken_parent_link:${chain[i].coatHash}`);
            if (chain[i].mutationDepth !== chain[i + 1].mutationDepth + 1)
                reasons.push(`bad_mutation_depth:${chain[i].coatHash}`);
        }
        return { valid: reasons.length === 0, reasons };
    }
}
exports.CoatLedger = CoatLedger;
exports.DEFAULT_COAT_POLICY = {
    minIntegrity: 0.65,
    maxMutationDepth: 256,
    requireTrustedSigner: false,
    deniedPermissions: ["arbitrary_network", "outside_workspace_write", "credential_access", "autonomous_replication"],
};
function clamp01(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.max(0, Math.min(1, n));
}
