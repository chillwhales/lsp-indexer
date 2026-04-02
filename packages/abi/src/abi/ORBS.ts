import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    DataChanged: event("0xece574603820d07bc9b91f2a932baadf4628aabcb8afba49776529c14a6104b2", "DataChanged(bytes32,bytes)", {"dataKey": indexed(p.bytes32), "dataValue": p.bytes}),
    OperatorAuthorizationChanged: event("0x1b1b58aa2ec0cec2228b2d37124556d41f5a1f7b12f089171f896cc236671215", "OperatorAuthorizationChanged(address,address,bytes32,bytes)", {"operator": indexed(p.address), "tokenOwner": indexed(p.address), "tokenId": indexed(p.bytes32), "operatorNotificationData": p.bytes}),
    OperatorRevoked: event("0xc78cd419d6136f9f1c1c6aec1d3fae098cffaf8bc86314a8f2685e32fe574e3c", "OperatorRevoked(address,address,bytes32,bool,bytes)", {"operator": indexed(p.address), "tokenOwner": indexed(p.address), "tokenId": indexed(p.bytes32), "notified": p.bool, "operatorNotificationData": p.bytes}),
    OwnershipTransferred: event("0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", "OwnershipTransferred(address,address)", {"previousOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    TokenIdDataChanged: event("0xa6e4251f855f750545fe414f120db91c76b88def14d120969e5bb2d3f05debbb", "TokenIdDataChanged(bytes32,bytes32,bytes)", {"tokenId": indexed(p.bytes32), "dataKey": indexed(p.bytes32), "dataValue": p.bytes}),
    Transfer: event("0xb333c813a7426a7a11e2b190cad52c44119421594b47f6f32ace6d8c7207b2bf", "Transfer(address,address,address,bytes32,bool,bytes)", {"operator": p.address, "from": indexed(p.address), "to": indexed(p.address), "tokenId": indexed(p.bytes32), "force": p.bool, "data": p.bytes}),
    UniversalReceiver: event("0x9c3ba68eb5742b8e3961aea0afc7371a71bf433c8a67a831803b64c064a178c2", "UniversalReceiver(address,uint256,bytes32,bytes,bytes)", {"from": indexed(p.address), "value": indexed(p.uint256), "typeId": indexed(p.bytes32), "receivedData": p.bytes, "returnedValue": p.bytes}),
}

export const functions = {
    authorizeOperator: fun("0x86a10ddd", "authorizeOperator(address,bytes32,bytes)", {"operator": p.address, "tokenId": p.bytes32, "operatorNotificationData": p.bytes}, ),
    balanceOf: viewFun("0x70a08231", "balanceOf(address)", {"tokenOwner": p.address}, p.uint256),
    batchCalls: fun("0x6963d438", "batchCalls(bytes[])", {"data": p.array(p.bytes)}, p.array(p.bytes)),
    burn: fun("0x00d98c7a", "burn(bytes32,address,bytes)", {"tokenId": p.bytes32, "chillRecipient": p.address, "data": p.bytes}, ),
    getChillwhaleClaimStatus: viewFun("0x4bbb61b8", "getChillwhaleClaimStatus(bytes32)", {"tokenId": p.bytes32}, p.bool),
    getData: viewFun("0x54f6127f", "getData(bytes32)", {"dataKey": p.bytes32}, p.bytes),
    getDataBatch: viewFun("0xdedff9c6", "getDataBatch(bytes32[])", {"dataKeys": p.array(p.bytes32)}, p.array(p.bytes)),
    getDataBatchForTokenIds: viewFun("0x1d26fce6", "getDataBatchForTokenIds(bytes32[],bytes32[])", {"tokenIds": p.array(p.bytes32), "dataKeys": p.array(p.bytes32)}, p.array(p.bytes)),
    getDataForTokenId: viewFun("0x16e023b3", "getDataForTokenId(bytes32,bytes32)", {"tokenId": p.bytes32, "dataKey": p.bytes32}, p.bytes),
    getFactionSupply: viewFun("0xab503e98", "getFactionSupply(uint8)", {"faction": p.uint8}, p.uint256),
    getOperatorsOf: viewFun("0x49a6078d", "getOperatorsOf(bytes32)", {"tokenId": p.bytes32}, p.array(p.address)),
    isOperatorFor: viewFun("0x2a3654a4", "isOperatorFor(address,bytes32)", {"operator": p.address, "tokenId": p.bytes32}, p.bool),
    mint: fun("0xaf255b61", "mint(address,bytes32,bool,bytes)", {"receiver": p.address, "tokenId": p.bytes32, "force": p.bool, "data": p.bytes}, ),
    mintBatch: fun("0x2b34cd86", "mintBatch(address[],bytes32[],bool[],bytes[])", {"receivers": p.array(p.address), "tokenIds": p.array(p.bytes32), "forces": p.array(p.bool), "datas": p.array(p.bytes)}, ),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    renounceOwnership: fun("0x715018a6", "renounceOwnership()", {}, ),
    revokeOperator: fun("0xdb8c9663", "revokeOperator(address,bytes32,bool,bytes)", {"operator": p.address, "tokenId": p.bytes32, "notify": p.bool, "operatorNotificationData": p.bytes}, ),
    setData: fun("0x7f23690c", "setData(bytes32,bytes)", {"dataKey": p.bytes32, "dataValue": p.bytes}, ),
    setDataBatch: fun("0x97902421", "setDataBatch(bytes32[],bytes[])", {"dataKeys": p.array(p.bytes32), "dataValues": p.array(p.bytes)}, ),
    setDataBatchForTokenIds: fun("0xbe9f0e6f", "setDataBatchForTokenIds(bytes32[],bytes32[],bytes[])", {"tokenIds": p.array(p.bytes32), "dataKeys": p.array(p.bytes32), "dataValues": p.array(p.bytes)}, ),
    setDataForTokenId: fun("0xd6c1407c", "setDataForTokenId(bytes32,bytes32,bytes)", {"tokenId": p.bytes32, "dataKey": p.bytes32, "dataValue": p.bytes}, ),
    supportsInterface: viewFun("0x01ffc9a7", "supportsInterface(bytes4)", {"interfaceId": p.bytes4}, p.bool),
    tokenIdsOf: viewFun("0xa3b261f2", "tokenIdsOf(address)", {"tokenOwner": p.address}, p.array(p.bytes32)),
    tokenOwnerOf: viewFun("0x217b2270", "tokenOwnerOf(bytes32)", {"tokenId": p.bytes32}, p.address),
    totalSupply: viewFun("0x18160ddd", "totalSupply()", {}, p.uint256),
    transfer: fun("0x511b6952", "transfer(address,address,bytes32,bool,bytes)", {"from": p.address, "to": p.address, "tokenId": p.bytes32, "force": p.bool, "data": p.bytes}, ),
    transferBatch: fun("0x7e87632c", "transferBatch(address[],address[],bytes32[],bool[],bytes[])", {"from": p.array(p.address), "to": p.array(p.address), "tokenId": p.array(p.bytes32), "force": p.array(p.bool), "data": p.array(p.bytes)}, ),
    transferOwnership: fun("0xf2fde38b", "transferOwnership(address)", {"newOwner": p.address}, ),
    unclaimedChillwhalesOf: viewFun("0xcc1a701d", "unclaimedChillwhalesOf(address)", {"tokenOwner": p.address}, p.array(p.bytes32)),
    universalReceiver: fun("0x6bb56a14", "universalReceiver(bytes32,bytes)", {"typeId": p.bytes32, "data": p.bytes}, p.bytes),
}

export class Contract extends ContractBase {

    balanceOf(tokenOwner: BalanceOfParams["tokenOwner"]) {
        return this.eth_call(functions.balanceOf, {tokenOwner})
    }

    getChillwhaleClaimStatus(tokenId: GetChillwhaleClaimStatusParams["tokenId"]) {
        return this.eth_call(functions.getChillwhaleClaimStatus, {tokenId})
    }

    getData(dataKey: GetDataParams["dataKey"]) {
        return this.eth_call(functions.getData, {dataKey})
    }

    getDataBatch(dataKeys: GetDataBatchParams["dataKeys"]) {
        return this.eth_call(functions.getDataBatch, {dataKeys})
    }

    getDataBatchForTokenIds(tokenIds: GetDataBatchForTokenIdsParams["tokenIds"], dataKeys: GetDataBatchForTokenIdsParams["dataKeys"]) {
        return this.eth_call(functions.getDataBatchForTokenIds, {tokenIds, dataKeys})
    }

    getDataForTokenId(tokenId: GetDataForTokenIdParams["tokenId"], dataKey: GetDataForTokenIdParams["dataKey"]) {
        return this.eth_call(functions.getDataForTokenId, {tokenId, dataKey})
    }

    getFactionSupply(faction: GetFactionSupplyParams["faction"]) {
        return this.eth_call(functions.getFactionSupply, {faction})
    }

    getOperatorsOf(tokenId: GetOperatorsOfParams["tokenId"]) {
        return this.eth_call(functions.getOperatorsOf, {tokenId})
    }

    isOperatorFor(operator: IsOperatorForParams["operator"], tokenId: IsOperatorForParams["tokenId"]) {
        return this.eth_call(functions.isOperatorFor, {operator, tokenId})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }

    supportsInterface(interfaceId: SupportsInterfaceParams["interfaceId"]) {
        return this.eth_call(functions.supportsInterface, {interfaceId})
    }

    tokenIdsOf(tokenOwner: TokenIdsOfParams["tokenOwner"]) {
        return this.eth_call(functions.tokenIdsOf, {tokenOwner})
    }

    tokenOwnerOf(tokenId: TokenOwnerOfParams["tokenId"]) {
        return this.eth_call(functions.tokenOwnerOf, {tokenId})
    }

    totalSupply() {
        return this.eth_call(functions.totalSupply, {})
    }

    unclaimedChillwhalesOf(tokenOwner: UnclaimedChillwhalesOfParams["tokenOwner"]) {
        return this.eth_call(functions.unclaimedChillwhalesOf, {tokenOwner})
    }
}

/// Event types
export type DataChangedEventArgs = EParams<typeof events.DataChanged>
export type OperatorAuthorizationChangedEventArgs = EParams<typeof events.OperatorAuthorizationChanged>
export type OperatorRevokedEventArgs = EParams<typeof events.OperatorRevoked>
export type OwnershipTransferredEventArgs = EParams<typeof events.OwnershipTransferred>
export type TokenIdDataChangedEventArgs = EParams<typeof events.TokenIdDataChanged>
export type TransferEventArgs = EParams<typeof events.Transfer>
export type UniversalReceiverEventArgs = EParams<typeof events.UniversalReceiver>

/// Function types
export type AuthorizeOperatorParams = FunctionArguments<typeof functions.authorizeOperator>
export type AuthorizeOperatorReturn = FunctionReturn<typeof functions.authorizeOperator>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type BatchCallsParams = FunctionArguments<typeof functions.batchCalls>
export type BatchCallsReturn = FunctionReturn<typeof functions.batchCalls>

export type BurnParams = FunctionArguments<typeof functions.burn>
export type BurnReturn = FunctionReturn<typeof functions.burn>

export type GetChillwhaleClaimStatusParams = FunctionArguments<typeof functions.getChillwhaleClaimStatus>
export type GetChillwhaleClaimStatusReturn = FunctionReturn<typeof functions.getChillwhaleClaimStatus>

export type GetDataParams = FunctionArguments<typeof functions.getData>
export type GetDataReturn = FunctionReturn<typeof functions.getData>

export type GetDataBatchParams = FunctionArguments<typeof functions.getDataBatch>
export type GetDataBatchReturn = FunctionReturn<typeof functions.getDataBatch>

export type GetDataBatchForTokenIdsParams = FunctionArguments<typeof functions.getDataBatchForTokenIds>
export type GetDataBatchForTokenIdsReturn = FunctionReturn<typeof functions.getDataBatchForTokenIds>

export type GetDataForTokenIdParams = FunctionArguments<typeof functions.getDataForTokenId>
export type GetDataForTokenIdReturn = FunctionReturn<typeof functions.getDataForTokenId>

export type GetFactionSupplyParams = FunctionArguments<typeof functions.getFactionSupply>
export type GetFactionSupplyReturn = FunctionReturn<typeof functions.getFactionSupply>

export type GetOperatorsOfParams = FunctionArguments<typeof functions.getOperatorsOf>
export type GetOperatorsOfReturn = FunctionReturn<typeof functions.getOperatorsOf>

export type IsOperatorForParams = FunctionArguments<typeof functions.isOperatorFor>
export type IsOperatorForReturn = FunctionReturn<typeof functions.isOperatorFor>

export type MintParams = FunctionArguments<typeof functions.mint>
export type MintReturn = FunctionReturn<typeof functions.mint>

export type MintBatchParams = FunctionArguments<typeof functions.mintBatch>
export type MintBatchReturn = FunctionReturn<typeof functions.mintBatch>

export type OwnerParams = FunctionArguments<typeof functions.owner>
export type OwnerReturn = FunctionReturn<typeof functions.owner>

export type RenounceOwnershipParams = FunctionArguments<typeof functions.renounceOwnership>
export type RenounceOwnershipReturn = FunctionReturn<typeof functions.renounceOwnership>

export type RevokeOperatorParams = FunctionArguments<typeof functions.revokeOperator>
export type RevokeOperatorReturn = FunctionReturn<typeof functions.revokeOperator>

export type SetDataParams = FunctionArguments<typeof functions.setData>
export type SetDataReturn = FunctionReturn<typeof functions.setData>

export type SetDataBatchParams = FunctionArguments<typeof functions.setDataBatch>
export type SetDataBatchReturn = FunctionReturn<typeof functions.setDataBatch>

export type SetDataBatchForTokenIdsParams = FunctionArguments<typeof functions.setDataBatchForTokenIds>
export type SetDataBatchForTokenIdsReturn = FunctionReturn<typeof functions.setDataBatchForTokenIds>

export type SetDataForTokenIdParams = FunctionArguments<typeof functions.setDataForTokenId>
export type SetDataForTokenIdReturn = FunctionReturn<typeof functions.setDataForTokenId>

export type SupportsInterfaceParams = FunctionArguments<typeof functions.supportsInterface>
export type SupportsInterfaceReturn = FunctionReturn<typeof functions.supportsInterface>

export type TokenIdsOfParams = FunctionArguments<typeof functions.tokenIdsOf>
export type TokenIdsOfReturn = FunctionReturn<typeof functions.tokenIdsOf>

export type TokenOwnerOfParams = FunctionArguments<typeof functions.tokenOwnerOf>
export type TokenOwnerOfReturn = FunctionReturn<typeof functions.tokenOwnerOf>

export type TotalSupplyParams = FunctionArguments<typeof functions.totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof functions.totalSupply>

export type TransferParams = FunctionArguments<typeof functions.transfer>
export type TransferReturn = FunctionReturn<typeof functions.transfer>

export type TransferBatchParams = FunctionArguments<typeof functions.transferBatch>
export type TransferBatchReturn = FunctionReturn<typeof functions.transferBatch>

export type TransferOwnershipParams = FunctionArguments<typeof functions.transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof functions.transferOwnership>

export type UnclaimedChillwhalesOfParams = FunctionArguments<typeof functions.unclaimedChillwhalesOf>
export type UnclaimedChillwhalesOfReturn = FunctionReturn<typeof functions.unclaimedChillwhalesOf>

export type UniversalReceiverParams = FunctionArguments<typeof functions.universalReceiver>
export type UniversalReceiverReturn = FunctionReturn<typeof functions.universalReceiver>

