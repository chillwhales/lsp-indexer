import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    ContractCreated: event("0xa1fb700aaee2ae4a2ff6f91ce7eba292f89c2f5488b8ec4c5c5c8150692595c3", "ContractCreated(uint256,address,uint256,bytes32)", {"operationType": indexed(p.uint256), "contractAddress": indexed(p.address), "value": p.uint256, "salt": indexed(p.bytes32)}),
    DataChanged: event("0xece574603820d07bc9b91f2a932baadf4628aabcb8afba49776529c14a6104b2", "DataChanged(bytes32,bytes)", {"dataKey": indexed(p.bytes32), "dataValue": p.bytes}),
    Executed: event("0x4810874456b8e6487bd861375cf6abd8e1c8bb5858c8ce36a86a04dabfac199e", "Executed(uint256,address,uint256,bytes4)", {"operationType": indexed(p.uint256), "target": indexed(p.address), "value": p.uint256, "selector": indexed(p.bytes4)}),
    OwnershipRenounced: event("0xd1f66c3d2bc1993a86be5e3d33709d98f0442381befcedd29f578b9b2506b1ce", "OwnershipRenounced()", {}),
    OwnershipTransferStarted: event("0x38d16b8cac22d99fc7c124b9cd0de2d3fa1faef420bfe791d8c362d765e22700", "OwnershipTransferStarted(address,address)", {"previousOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    OwnershipTransferred: event("0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", "OwnershipTransferred(address,address)", {"previousOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    RenounceOwnershipStarted: event("0x81b7f830f1f0084db6497c486cbe6974c86488dcc4e3738eab94ab6d6b1653e7", "RenounceOwnershipStarted()", {}),
    UniversalReceiver: event("0x9c3ba68eb5742b8e3961aea0afc7371a71bf433c8a67a831803b64c064a178c2", "UniversalReceiver(address,uint256,bytes32,bytes,bytes)", {"from": indexed(p.address), "value": indexed(p.uint256), "typeId": indexed(p.bytes32), "receivedData": p.bytes, "returnedValue": p.bytes}),
}

export const functions = {
    RENOUNCE_OWNERSHIP_CONFIRMATION_DELAY: viewFun("0xead3fbdf", "RENOUNCE_OWNERSHIP_CONFIRMATION_DELAY()", {}, p.uint256),
    RENOUNCE_OWNERSHIP_CONFIRMATION_PERIOD: viewFun("0x01bfba61", "RENOUNCE_OWNERSHIP_CONFIRMATION_PERIOD()", {}, p.uint256),
    VERSION: viewFun("0xffa1ad74", "VERSION()", {}, p.string),
    acceptOwnership: fun("0x79ba5097", "acceptOwnership()", {}, ),
    batchCalls: fun("0x6963d438", "batchCalls(bytes[])", {"data": p.array(p.bytes)}, p.array(p.bytes)),
    execute: fun("0x44c028fe", "execute(uint256,address,uint256,bytes)", {"operationType": p.uint256, "target": p.address, "value": p.uint256, "data": p.bytes}, p.bytes),
    executeBatch: fun("0x31858452", "executeBatch(uint256[],address[],uint256[],bytes[])", {"operationsType": p.array(p.uint256), "targets": p.array(p.address), "values": p.array(p.uint256), "datas": p.array(p.bytes)}, p.array(p.bytes)),
    executePostDeployment: fun("0x28c4d14e", "executePostDeployment(address,address,bytes)", {"universalProfile": p.address, "keyManager": p.address, "setDataBatchBytes": p.bytes}, ),
    getData: viewFun("0x54f6127f", "getData(bytes32)", {"dataKey": p.bytes32}, p.bytes),
    getDataBatch: viewFun("0xdedff9c6", "getDataBatch(bytes32[])", {"dataKeys": p.array(p.bytes32)}, p.array(p.bytes)),
    isValidSignature: viewFun("0x1626ba7e", "isValidSignature(bytes32,bytes)", {"dataHash": p.bytes32, "signature": p.bytes}, p.bytes4),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    pendingOwner: viewFun("0xe30c3978", "pendingOwner()", {}, p.address),
    renounceOwnership: fun("0x715018a6", "renounceOwnership()", {}, ),
    setData: fun("0x7f23690c", "setData(bytes32,bytes)", {"dataKey": p.bytes32, "dataValue": p.bytes}, ),
    setDataAndTransferOwnership: fun("0x4f04d60a", "setDataAndTransferOwnership(bytes32[],bytes[],address)", {"dataKeys": p.array(p.bytes32), "dataValues": p.array(p.bytes), "newOwner": p.address}, ),
    setDataBatch: fun("0x97902421", "setDataBatch(bytes32[],bytes[])", {"dataKeys": p.array(p.bytes32), "dataValues": p.array(p.bytes)}, ),
    supportsInterface: viewFun("0x01ffc9a7", "supportsInterface(bytes4)", {"interfaceId": p.bytes4}, p.bool),
    transferOwnership: fun("0xf2fde38b", "transferOwnership(address)", {"pendingNewOwner": p.address}, ),
    universalReceiver: fun("0x6bb56a14", "universalReceiver(bytes32,bytes)", {"typeId": p.bytes32, "receivedData": p.bytes}, p.bytes),
}

export class Contract extends ContractBase {

    RENOUNCE_OWNERSHIP_CONFIRMATION_DELAY() {
        return this.eth_call(functions.RENOUNCE_OWNERSHIP_CONFIRMATION_DELAY, {})
    }

    RENOUNCE_OWNERSHIP_CONFIRMATION_PERIOD() {
        return this.eth_call(functions.RENOUNCE_OWNERSHIP_CONFIRMATION_PERIOD, {})
    }

    VERSION() {
        return this.eth_call(functions.VERSION, {})
    }

    getData(dataKey: GetDataParams["dataKey"]) {
        return this.eth_call(functions.getData, {dataKey})
    }

    getDataBatch(dataKeys: GetDataBatchParams["dataKeys"]) {
        return this.eth_call(functions.getDataBatch, {dataKeys})
    }

    isValidSignature(dataHash: IsValidSignatureParams["dataHash"], signature: IsValidSignatureParams["signature"]) {
        return this.eth_call(functions.isValidSignature, {dataHash, signature})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }

    pendingOwner() {
        return this.eth_call(functions.pendingOwner, {})
    }

    supportsInterface(interfaceId: SupportsInterfaceParams["interfaceId"]) {
        return this.eth_call(functions.supportsInterface, {interfaceId})
    }
}

/// Event types
export type ContractCreatedEventArgs = EParams<typeof events.ContractCreated>
export type DataChangedEventArgs = EParams<typeof events.DataChanged>
export type ExecutedEventArgs = EParams<typeof events.Executed>
export type OwnershipRenouncedEventArgs = EParams<typeof events.OwnershipRenounced>
export type OwnershipTransferStartedEventArgs = EParams<typeof events.OwnershipTransferStarted>
export type OwnershipTransferredEventArgs = EParams<typeof events.OwnershipTransferred>
export type RenounceOwnershipStartedEventArgs = EParams<typeof events.RenounceOwnershipStarted>
export type UniversalReceiverEventArgs = EParams<typeof events.UniversalReceiver>

/// Function types
export type RENOUNCE_OWNERSHIP_CONFIRMATION_DELAYParams = FunctionArguments<typeof functions.RENOUNCE_OWNERSHIP_CONFIRMATION_DELAY>
export type RENOUNCE_OWNERSHIP_CONFIRMATION_DELAYReturn = FunctionReturn<typeof functions.RENOUNCE_OWNERSHIP_CONFIRMATION_DELAY>

export type RENOUNCE_OWNERSHIP_CONFIRMATION_PERIODParams = FunctionArguments<typeof functions.RENOUNCE_OWNERSHIP_CONFIRMATION_PERIOD>
export type RENOUNCE_OWNERSHIP_CONFIRMATION_PERIODReturn = FunctionReturn<typeof functions.RENOUNCE_OWNERSHIP_CONFIRMATION_PERIOD>

export type VERSIONParams = FunctionArguments<typeof functions.VERSION>
export type VERSIONReturn = FunctionReturn<typeof functions.VERSION>

export type AcceptOwnershipParams = FunctionArguments<typeof functions.acceptOwnership>
export type AcceptOwnershipReturn = FunctionReturn<typeof functions.acceptOwnership>

export type BatchCallsParams = FunctionArguments<typeof functions.batchCalls>
export type BatchCallsReturn = FunctionReturn<typeof functions.batchCalls>

export type ExecuteParams = FunctionArguments<typeof functions.execute>
export type ExecuteReturn = FunctionReturn<typeof functions.execute>

export type ExecuteBatchParams = FunctionArguments<typeof functions.executeBatch>
export type ExecuteBatchReturn = FunctionReturn<typeof functions.executeBatch>

export type ExecutePostDeploymentParams = FunctionArguments<typeof functions.executePostDeployment>
export type ExecutePostDeploymentReturn = FunctionReturn<typeof functions.executePostDeployment>

export type GetDataParams = FunctionArguments<typeof functions.getData>
export type GetDataReturn = FunctionReturn<typeof functions.getData>

export type GetDataBatchParams = FunctionArguments<typeof functions.getDataBatch>
export type GetDataBatchReturn = FunctionReturn<typeof functions.getDataBatch>

export type IsValidSignatureParams = FunctionArguments<typeof functions.isValidSignature>
export type IsValidSignatureReturn = FunctionReturn<typeof functions.isValidSignature>

export type OwnerParams = FunctionArguments<typeof functions.owner>
export type OwnerReturn = FunctionReturn<typeof functions.owner>

export type PendingOwnerParams = FunctionArguments<typeof functions.pendingOwner>
export type PendingOwnerReturn = FunctionReturn<typeof functions.pendingOwner>

export type RenounceOwnershipParams = FunctionArguments<typeof functions.renounceOwnership>
export type RenounceOwnershipReturn = FunctionReturn<typeof functions.renounceOwnership>

export type SetDataParams = FunctionArguments<typeof functions.setData>
export type SetDataReturn = FunctionReturn<typeof functions.setData>

export type SetDataAndTransferOwnershipParams = FunctionArguments<typeof functions.setDataAndTransferOwnership>
export type SetDataAndTransferOwnershipReturn = FunctionReturn<typeof functions.setDataAndTransferOwnership>

export type SetDataBatchParams = FunctionArguments<typeof functions.setDataBatch>
export type SetDataBatchReturn = FunctionReturn<typeof functions.setDataBatch>

export type SupportsInterfaceParams = FunctionArguments<typeof functions.supportsInterface>
export type SupportsInterfaceReturn = FunctionReturn<typeof functions.supportsInterface>

export type TransferOwnershipParams = FunctionArguments<typeof functions.transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof functions.transferOwnership>

export type UniversalReceiverParams = FunctionArguments<typeof functions.universalReceiver>
export type UniversalReceiverReturn = FunctionReturn<typeof functions.universalReceiver>

