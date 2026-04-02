import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    DataChanged: event("0xece574603820d07bc9b91f2a932baadf4628aabcb8afba49776529c14a6104b2", "DataChanged(bytes32,bytes)", {"dataKey": indexed(p.bytes32), "dataValue": p.bytes}),
    OwnershipTransferred: event("0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", "OwnershipTransferred(address,address)", {"previousOwner": indexed(p.address), "newOwner": indexed(p.address)}),
}

export const functions = {
    getData: viewFun("0x54f6127f", "getData(bytes32)", {"dataKey": p.bytes32}, p.bytes),
    getDataBatch: viewFun("0xdedff9c6", "getDataBatch(bytes32[])", {"dataKeys": p.array(p.bytes32)}, p.array(p.bytes)),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    renounceOwnership: fun("0x715018a6", "renounceOwnership()", {}, ),
    setData: fun("0x7f23690c", "setData(bytes32,bytes)", {"dataKey": p.bytes32, "dataValue": p.bytes}, ),
    setDataBatch: fun("0x97902421", "setDataBatch(bytes32[],bytes[])", {"dataKeys": p.array(p.bytes32), "dataValues": p.array(p.bytes)}, ),
    supportsInterface: viewFun("0x01ffc9a7", "supportsInterface(bytes4)", {"interfaceId": p.bytes4}, p.bool),
    transferOwnership: fun("0xf2fde38b", "transferOwnership(address)", {"newOwner": p.address}, ),
}

export class Contract extends ContractBase {

    getData(dataKey: GetDataParams["dataKey"]) {
        return this.eth_call(functions.getData, {dataKey})
    }

    getDataBatch(dataKeys: GetDataBatchParams["dataKeys"]) {
        return this.eth_call(functions.getDataBatch, {dataKeys})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }

    supportsInterface(interfaceId: SupportsInterfaceParams["interfaceId"]) {
        return this.eth_call(functions.supportsInterface, {interfaceId})
    }
}

/// Event types
export type DataChangedEventArgs = EParams<typeof events.DataChanged>
export type OwnershipTransferredEventArgs = EParams<typeof events.OwnershipTransferred>

/// Function types
export type GetDataParams = FunctionArguments<typeof functions.getData>
export type GetDataReturn = FunctionReturn<typeof functions.getData>

export type GetDataBatchParams = FunctionArguments<typeof functions.getDataBatch>
export type GetDataBatchReturn = FunctionReturn<typeof functions.getDataBatch>

export type OwnerParams = FunctionArguments<typeof functions.owner>
export type OwnerReturn = FunctionReturn<typeof functions.owner>

export type RenounceOwnershipParams = FunctionArguments<typeof functions.renounceOwnership>
export type RenounceOwnershipReturn = FunctionReturn<typeof functions.renounceOwnership>

export type SetDataParams = FunctionArguments<typeof functions.setData>
export type SetDataReturn = FunctionReturn<typeof functions.setData>

export type SetDataBatchParams = FunctionArguments<typeof functions.setDataBatch>
export type SetDataBatchReturn = FunctionReturn<typeof functions.setDataBatch>

export type SupportsInterfaceParams = FunctionArguments<typeof functions.supportsInterface>
export type SupportsInterfaceReturn = FunctionReturn<typeof functions.supportsInterface>

export type TransferOwnershipParams = FunctionArguments<typeof functions.transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof functions.transferOwnership>

