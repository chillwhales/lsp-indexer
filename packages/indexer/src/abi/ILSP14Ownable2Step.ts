import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    OwnershipRenounced: event("0xd1f66c3d2bc1993a86be5e3d33709d98f0442381befcedd29f578b9b2506b1ce", "OwnershipRenounced()", {}),
    OwnershipTransferStarted: event("0x38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e22700", "OwnershipTransferStarted(address,address)", {"previousOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    RenounceOwnershipStarted: event("0x81b7f830f1f0084db6497c486cbe6974c86488dcc4e3738eab94ab6d6b1653e7", "RenounceOwnershipStarted()", {}),
}

export const functions = {
    acceptOwnership: fun("0x79ba5097", "acceptOwnership()", {}, ),
    pendingOwner: viewFun("0xe30c3978", "pendingOwner()", {}, p.address),
    renounceOwnership: fun("0x715018a6", "renounceOwnership()", {}, ),
    transferOwnership: fun("0xf2fde38b", "transferOwnership(address)", {"newOwner": p.address}, ),
}

export class Contract extends ContractBase {

    pendingOwner() {
        return this.eth_call(functions.pendingOwner, {})
    }
}

/// Event types
export type OwnershipRenouncedEventArgs = EParams<typeof events.OwnershipRenounced>
export type OwnershipTransferStartedEventArgs = EParams<typeof events.OwnershipTransferStarted>
export type RenounceOwnershipStartedEventArgs = EParams<typeof events.RenounceOwnershipStarted>

/// Function types
export type AcceptOwnershipParams = FunctionArguments<typeof functions.acceptOwnership>
export type AcceptOwnershipReturn = FunctionReturn<typeof functions.acceptOwnership>

export type PendingOwnerParams = FunctionArguments<typeof functions.pendingOwner>
export type PendingOwnerReturn = FunctionReturn<typeof functions.pendingOwner>

export type RenounceOwnershipParams = FunctionArguments<typeof functions.renounceOwnership>
export type RenounceOwnershipReturn = FunctionReturn<typeof functions.renounceOwnership>

export type TransferOwnershipParams = FunctionArguments<typeof functions.transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof functions.transferOwnership>

