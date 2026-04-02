import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    OperatorAuthorizationChanged: event("0xf772a43bfdf4729b196e3fb54a818b91a2ca6c49d10b2e16278752f9f515c25d", "OperatorAuthorizationChanged(address,address,uint256,bytes)", {"operator": indexed(p.address), "tokenOwner": indexed(p.address), "amount": indexed(p.uint256), "operatorNotificationData": p.bytes}),
    OperatorRevoked: event("0x0ebf5762d8855cbe012d2ca42fb33a81175e17c8a8751f8859931ba453bd4167", "OperatorRevoked(address,address,bool,bytes)", {"operator": indexed(p.address), "tokenOwner": indexed(p.address), "notified": indexed(p.bool), "operatorNotificationData": p.bytes}),
    Transfer: event("0x3997e418d2cef0b3b0e907b1e39605c3f7d32dbd061e82ea5b4a770d46a160a6", "Transfer(address,address,address,uint256,bool,bytes)", {"operator": indexed(p.address), "from": indexed(p.address), "to": indexed(p.address), "amount": p.uint256, "force": p.bool, "data": p.bytes}),
}

export const functions = {
    authorizeOperator: fun("0xb49506fd", "authorizeOperator(address,uint256,bytes)", {"operator": p.address, "amount": p.uint256, "operatorNotificationData": p.bytes}, ),
    authorizedAmountFor: viewFun("0x65aeaa95", "authorizedAmountFor(address,address)", {"operator": p.address, "tokenOwner": p.address}, p.uint256),
    balanceOf: viewFun("0x70a08231", "balanceOf(address)", {"tokenOwner": p.address}, p.uint256),
    batchCalls: fun("0x6963d438", "batchCalls(bytes[])", {"data": p.array(p.bytes)}, p.array(p.bytes)),
    decimals: viewFun("0x313ce567", "decimals()", {}, p.uint8),
    decreaseAllowance: fun("0x78381670", "decreaseAllowance(address,address,uint256,bytes)", {"operator": p.address, "tokenOwner": p.address, "subtractedAmount": p.uint256, "operatorNotificationData": p.bytes}, ),
    getOperatorsOf: viewFun("0xd72fc29a", "getOperatorsOf(address)", {"tokenOwner": p.address}, p.array(p.address)),
    increaseAllowance: fun("0x2bc1da82", "increaseAllowance(address,uint256,bytes)", {"operator": p.address, "addedAmount": p.uint256, "operatorNotificationData": p.bytes}, ),
    revokeOperator: fun("0x30d0dc37", "revokeOperator(address,address,bool,bytes)", {"operator": p.address, "tokenOwner": p.address, "notify": p.bool, "operatorNotificationData": p.bytes}, ),
    totalSupply: viewFun("0x18160ddd", "totalSupply()", {}, p.uint256),
    transfer: fun("0x760d9bba", "transfer(address,address,uint256,bool,bytes)", {"from": p.address, "to": p.address, "amount": p.uint256, "force": p.bool, "data": p.bytes}, ),
    transferBatch: fun("0x2d7667c9", "transferBatch(address[],address[],uint256[],bool[],bytes[])", {"from": p.array(p.address), "to": p.array(p.address), "amount": p.array(p.uint256), "force": p.array(p.bool), "data": p.array(p.bytes)}, ),
}

export class Contract extends ContractBase {

    authorizedAmountFor(operator: AuthorizedAmountForParams["operator"], tokenOwner: AuthorizedAmountForParams["tokenOwner"]) {
        return this.eth_call(functions.authorizedAmountFor, {operator, tokenOwner})
    }

    balanceOf(tokenOwner: BalanceOfParams["tokenOwner"]) {
        return this.eth_call(functions.balanceOf, {tokenOwner})
    }

    decimals() {
        return this.eth_call(functions.decimals, {})
    }

    getOperatorsOf(tokenOwner: GetOperatorsOfParams["tokenOwner"]) {
        return this.eth_call(functions.getOperatorsOf, {tokenOwner})
    }

    totalSupply() {
        return this.eth_call(functions.totalSupply, {})
    }
}

/// Event types
export type OperatorAuthorizationChangedEventArgs = EParams<typeof events.OperatorAuthorizationChanged>
export type OperatorRevokedEventArgs = EParams<typeof events.OperatorRevoked>
export type TransferEventArgs = EParams<typeof events.Transfer>

/// Function types
export type AuthorizeOperatorParams = FunctionArguments<typeof functions.authorizeOperator>
export type AuthorizeOperatorReturn = FunctionReturn<typeof functions.authorizeOperator>

export type AuthorizedAmountForParams = FunctionArguments<typeof functions.authorizedAmountFor>
export type AuthorizedAmountForReturn = FunctionReturn<typeof functions.authorizedAmountFor>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type BatchCallsParams = FunctionArguments<typeof functions.batchCalls>
export type BatchCallsReturn = FunctionReturn<typeof functions.batchCalls>

export type DecimalsParams = FunctionArguments<typeof functions.decimals>
export type DecimalsReturn = FunctionReturn<typeof functions.decimals>

export type DecreaseAllowanceParams = FunctionArguments<typeof functions.decreaseAllowance>
export type DecreaseAllowanceReturn = FunctionReturn<typeof functions.decreaseAllowance>

export type GetOperatorsOfParams = FunctionArguments<typeof functions.getOperatorsOf>
export type GetOperatorsOfReturn = FunctionReturn<typeof functions.getOperatorsOf>

export type IncreaseAllowanceParams = FunctionArguments<typeof functions.increaseAllowance>
export type IncreaseAllowanceReturn = FunctionReturn<typeof functions.increaseAllowance>

export type RevokeOperatorParams = FunctionArguments<typeof functions.revokeOperator>
export type RevokeOperatorReturn = FunctionReturn<typeof functions.revokeOperator>

export type TotalSupplyParams = FunctionArguments<typeof functions.totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof functions.totalSupply>

export type TransferParams = FunctionArguments<typeof functions.transfer>
export type TransferReturn = FunctionReturn<typeof functions.transfer>

export type TransferBatchParams = FunctionArguments<typeof functions.transferBatch>
export type TransferBatchReturn = FunctionReturn<typeof functions.transferBatch>

