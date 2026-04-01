import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    PermissionsVerified: event("0xc0a62328f6bf5e3172bb1fcb2019f54b2c523b6a48e3513a2298fbf0150b781e", "PermissionsVerified(address,uint256,bytes4)", {"signer": indexed(p.address), "value": indexed(p.uint256), "selector": indexed(p.bytes4)}),
}

export const functions = {
    execute: fun("0x09c5eabe", "execute(bytes)", {"payload": p.bytes}, p.bytes),
    executeBatch: fun("0xbf0176ff", "executeBatch(uint256[],bytes[])", {"values": p.array(p.uint256), "payloads": p.array(p.bytes)}, p.array(p.bytes)),
    isValidSignature: viewFun("0x1626ba7e", "isValidSignature(bytes32,bytes)", {"hash": p.bytes32, "signature": p.bytes}, p.bytes4),
    target: viewFun("0xd4b83992", "target()", {}, p.address),
}

export class Contract extends ContractBase {

    isValidSignature(hash: IsValidSignatureParams["hash"], signature: IsValidSignatureParams["signature"]) {
        return this.eth_call(functions.isValidSignature, {hash, signature})
    }

    target() {
        return this.eth_call(functions.target, {})
    }
}

/// Event types
export type PermissionsVerifiedEventArgs = EParams<typeof events.PermissionsVerified>

/// Function types
export type ExecuteParams = FunctionArguments<typeof functions.execute>
export type ExecuteReturn = FunctionReturn<typeof functions.execute>

export type ExecuteBatchParams = FunctionArguments<typeof functions.executeBatch>
export type ExecuteBatchReturn = FunctionReturn<typeof functions.executeBatch>

export type IsValidSignatureParams = FunctionArguments<typeof functions.isValidSignature>
export type IsValidSignatureReturn = FunctionReturn<typeof functions.isValidSignature>

export type TargetParams = FunctionArguments<typeof functions.target>
export type TargetReturn = FunctionReturn<typeof functions.target>

