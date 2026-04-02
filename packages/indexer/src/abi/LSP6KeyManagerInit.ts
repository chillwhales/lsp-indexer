import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    Initialized: event("0x7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498", "Initialized(uint8)", {"version": p.uint8}),
    PermissionsVerified: event("0xc0a62328f6bf5e3172bb1fcb2019f54b2c523b6a48e3513a2298fbf0150b781e", "PermissionsVerified(address,uint256,bytes4)", {"signer": indexed(p.address), "value": indexed(p.uint256), "selector": indexed(p.bytes4)}),
}

export const functions = {
    VERSION: viewFun("0xffa1ad74", "VERSION()", {}, p.string),
    execute: fun("0x09c5eabe", "execute(bytes)", {"payload": p.bytes}, p.bytes),
    executeBatch: fun("0xbf0176ff", "executeBatch(uint256[],bytes[])", {"values": p.array(p.uint256), "payloads": p.array(p.bytes)}, p.array(p.bytes)),
    executeRelayCall: fun("0x4c8a4e74", "executeRelayCall(bytes,uint256,uint256,bytes)", {"signature": p.bytes, "nonce": p.uint256, "validityTimestamps": p.uint256, "payload": p.bytes}, p.bytes),
    executeRelayCallBatch: fun("0xa20856a5", "executeRelayCallBatch(bytes[],uint256[],uint256[],uint256[],bytes[])", {"signatures": p.array(p.bytes), "nonces": p.array(p.uint256), "validityTimestamps": p.array(p.uint256), "values": p.array(p.uint256), "payloads": p.array(p.bytes)}, p.array(p.bytes)),
    getNonce: viewFun("0xb44581d9", "getNonce(address,uint128)", {"from": p.address, "channelId": p.uint128}, p.uint256),
    initialize: fun("0xc4d66de8", "initialize(address)", {"target_": p.address}, ),
    isValidSignature: viewFun("0x1626ba7e", "isValidSignature(bytes32,bytes)", {"dataHash": p.bytes32, "signature": p.bytes}, p.bytes4),
    lsp20VerifyCall: fun("0xde928f14", "lsp20VerifyCall(address,address,address,uint256,bytes)", {"_0": p.address, "targetContract": p.address, "caller": p.address, "msgValue": p.uint256, "callData": p.bytes}, p.bytes4),
    lsp20VerifyCallResult: fun("0xd3fc45d3", "lsp20VerifyCallResult(bytes32,bytes)", {"_0": p.bytes32, "_1": p.bytes}, p.bytes4),
    supportsInterface: viewFun("0x01ffc9a7", "supportsInterface(bytes4)", {"interfaceId": p.bytes4}, p.bool),
    target: viewFun("0xd4b83992", "target()", {}, p.address),
}

export class Contract extends ContractBase {

    VERSION() {
        return this.eth_call(functions.VERSION, {})
    }

    getNonce(from: GetNonceParams["from"], channelId: GetNonceParams["channelId"]) {
        return this.eth_call(functions.getNonce, {from, channelId})
    }

    isValidSignature(dataHash: IsValidSignatureParams["dataHash"], signature: IsValidSignatureParams["signature"]) {
        return this.eth_call(functions.isValidSignature, {dataHash, signature})
    }

    supportsInterface(interfaceId: SupportsInterfaceParams["interfaceId"]) {
        return this.eth_call(functions.supportsInterface, {interfaceId})
    }

    target() {
        return this.eth_call(functions.target, {})
    }
}

/// Event types
export type InitializedEventArgs = EParams<typeof events.Initialized>
export type PermissionsVerifiedEventArgs = EParams<typeof events.PermissionsVerified>

/// Function types
export type VERSIONParams = FunctionArguments<typeof functions.VERSION>
export type VERSIONReturn = FunctionReturn<typeof functions.VERSION>

export type ExecuteParams = FunctionArguments<typeof functions.execute>
export type ExecuteReturn = FunctionReturn<typeof functions.execute>

export type ExecuteBatchParams = FunctionArguments<typeof functions.executeBatch>
export type ExecuteBatchReturn = FunctionReturn<typeof functions.executeBatch>

export type ExecuteRelayCallParams = FunctionArguments<typeof functions.executeRelayCall>
export type ExecuteRelayCallReturn = FunctionReturn<typeof functions.executeRelayCall>

export type ExecuteRelayCallBatchParams = FunctionArguments<typeof functions.executeRelayCallBatch>
export type ExecuteRelayCallBatchReturn = FunctionReturn<typeof functions.executeRelayCallBatch>

export type GetNonceParams = FunctionArguments<typeof functions.getNonce>
export type GetNonceReturn = FunctionReturn<typeof functions.getNonce>

export type InitializeParams = FunctionArguments<typeof functions.initialize>
export type InitializeReturn = FunctionReturn<typeof functions.initialize>

export type IsValidSignatureParams = FunctionArguments<typeof functions.isValidSignature>
export type IsValidSignatureReturn = FunctionReturn<typeof functions.isValidSignature>

export type Lsp20VerifyCallParams = FunctionArguments<typeof functions.lsp20VerifyCall>
export type Lsp20VerifyCallReturn = FunctionReturn<typeof functions.lsp20VerifyCall>

export type Lsp20VerifyCallResultParams = FunctionArguments<typeof functions.lsp20VerifyCallResult>
export type Lsp20VerifyCallResultReturn = FunctionReturn<typeof functions.lsp20VerifyCallResult>

export type SupportsInterfaceParams = FunctionArguments<typeof functions.supportsInterface>
export type SupportsInterfaceReturn = FunctionReturn<typeof functions.supportsInterface>

export type TargetParams = FunctionArguments<typeof functions.target>
export type TargetReturn = FunctionReturn<typeof functions.target>

