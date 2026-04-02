import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    OperatorAuthorizationChanged: event("0x1b1b58aa2ec0cec2228b2d37124556d41f5a1f7b12f089171f896cc236671215", "OperatorAuthorizationChanged(address,address,bytes32,bytes)", {"operator": indexed(p.address), "tokenOwner": indexed(p.address), "tokenId": indexed(p.bytes32), "operatorNotificationData": p.bytes}),
    OperatorRevoked: event("0xc78cd419d6136f9f1c1c6aec1d3fae098cffaf8bc86314a8f2685e32fe574e3c", "OperatorRevoked(address,address,bytes32,bool,bytes)", {"operator": indexed(p.address), "tokenOwner": indexed(p.address), "tokenId": indexed(p.bytes32), "notified": p.bool, "operatorNotificationData": p.bytes}),
    TokenIdDataChanged: event("0xa6e4251f855f750545fe414f120db91c76b88def14d120969e5bb2d3f05debbb", "TokenIdDataChanged(bytes32,bytes32,bytes)", {"tokenId": indexed(p.bytes32), "dataKey": indexed(p.bytes32), "dataValue": p.bytes}),
    Transfer: event("0xb333c813a7426a7a11e2b190cad52c44119421594b47f6f32ace6d8c7207b2bf", "Transfer(address,address,address,bytes32,bool,bytes)", {"operator": p.address, "from": indexed(p.address), "to": indexed(p.address), "tokenId": indexed(p.bytes32), "force": p.bool, "data": p.bytes}),
}

export const functions = {
    authorizeOperator: fun("0x86a10ddd", "authorizeOperator(address,bytes32,bytes)", {"operator": p.address, "tokenId": p.bytes32, "operatorNotificationData": p.bytes}, ),
    balanceOf: viewFun("0x70a08231", "balanceOf(address)", {"tokenOwner": p.address}, p.uint256),
    batchCalls: fun("0x6963d438", "batchCalls(bytes[])", {"data": p.array(p.bytes)}, p.array(p.bytes)),
    getDataBatchForTokenIds: fun("0x1d26fce6", "getDataBatchForTokenIds(bytes32[],bytes32[])", {"tokenIds": p.array(p.bytes32), "dataKeys": p.array(p.bytes32)}, p.array(p.bytes)),
    getDataForTokenId: fun("0x16e023b3", "getDataForTokenId(bytes32,bytes32)", {"tokenId": p.bytes32, "dataKey": p.bytes32}, p.bytes),
    getOperatorsOf: viewFun("0x49a6078d", "getOperatorsOf(bytes32)", {"tokenId": p.bytes32}, p.array(p.address)),
    isOperatorFor: viewFun("0x2a3654a4", "isOperatorFor(address,bytes32)", {"operator": p.address, "tokenId": p.bytes32}, p.bool),
    revokeOperator: fun("0xdb8c9663", "revokeOperator(address,bytes32,bool,bytes)", {"operator": p.address, "tokenId": p.bytes32, "notify": p.bool, "operatorNotificationData": p.bytes}, ),
    setDataBatchForTokenIds: fun("0xbe9f0e6f", "setDataBatchForTokenIds(bytes32[],bytes32[],bytes[])", {"tokenIds": p.array(p.bytes32), "dataKeys": p.array(p.bytes32), "dataValues": p.array(p.bytes)}, ),
    setDataForTokenId: fun("0xd6c1407c", "setDataForTokenId(bytes32,bytes32,bytes)", {"tokenId": p.bytes32, "dataKey": p.bytes32, "dataValue": p.bytes}, ),
    tokenIdsOf: viewFun("0xa3b261f2", "tokenIdsOf(address)", {"tokenOwner": p.address}, p.array(p.bytes32)),
    tokenOwnerOf: viewFun("0x217b2270", "tokenOwnerOf(bytes32)", {"tokenId": p.bytes32}, p.address),
    totalSupply: viewFun("0x18160ddd", "totalSupply()", {}, p.uint256),
    transfer: fun("0x511b6952", "transfer(address,address,bytes32,bool,bytes)", {"from": p.address, "to": p.address, "tokenId": p.bytes32, "force": p.bool, "data": p.bytes}, ),
    transferBatch: fun("0x7e87632c", "transferBatch(address[],address[],bytes32[],bool[],bytes[])", {"from": p.array(p.address), "to": p.array(p.address), "tokenId": p.array(p.bytes32), "force": p.array(p.bool), "data": p.array(p.bytes)}, ),
}

export class Contract extends ContractBase {

    balanceOf(tokenOwner: BalanceOfParams["tokenOwner"]) {
        return this.eth_call(functions.balanceOf, {tokenOwner})
    }

    getOperatorsOf(tokenId: GetOperatorsOfParams["tokenId"]) {
        return this.eth_call(functions.getOperatorsOf, {tokenId})
    }

    isOperatorFor(operator: IsOperatorForParams["operator"], tokenId: IsOperatorForParams["tokenId"]) {
        return this.eth_call(functions.isOperatorFor, {operator, tokenId})
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
}

/// Event types
export type OperatorAuthorizationChangedEventArgs = EParams<typeof events.OperatorAuthorizationChanged>
export type OperatorRevokedEventArgs = EParams<typeof events.OperatorRevoked>
export type TokenIdDataChangedEventArgs = EParams<typeof events.TokenIdDataChanged>
export type TransferEventArgs = EParams<typeof events.Transfer>

/// Function types
export type AuthorizeOperatorParams = FunctionArguments<typeof functions.authorizeOperator>
export type AuthorizeOperatorReturn = FunctionReturn<typeof functions.authorizeOperator>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type BatchCallsParams = FunctionArguments<typeof functions.batchCalls>
export type BatchCallsReturn = FunctionReturn<typeof functions.batchCalls>

export type GetDataBatchForTokenIdsParams = FunctionArguments<typeof functions.getDataBatchForTokenIds>
export type GetDataBatchForTokenIdsReturn = FunctionReturn<typeof functions.getDataBatchForTokenIds>

export type GetDataForTokenIdParams = FunctionArguments<typeof functions.getDataForTokenId>
export type GetDataForTokenIdReturn = FunctionReturn<typeof functions.getDataForTokenId>

export type GetOperatorsOfParams = FunctionArguments<typeof functions.getOperatorsOf>
export type GetOperatorsOfReturn = FunctionReturn<typeof functions.getOperatorsOf>

export type IsOperatorForParams = FunctionArguments<typeof functions.isOperatorFor>
export type IsOperatorForReturn = FunctionReturn<typeof functions.isOperatorFor>

export type RevokeOperatorParams = FunctionArguments<typeof functions.revokeOperator>
export type RevokeOperatorReturn = FunctionReturn<typeof functions.revokeOperator>

export type SetDataBatchForTokenIdsParams = FunctionArguments<typeof functions.setDataBatchForTokenIds>
export type SetDataBatchForTokenIdsReturn = FunctionReturn<typeof functions.setDataBatchForTokenIds>

export type SetDataForTokenIdParams = FunctionArguments<typeof functions.setDataForTokenId>
export type SetDataForTokenIdReturn = FunctionReturn<typeof functions.setDataForTokenId>

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

