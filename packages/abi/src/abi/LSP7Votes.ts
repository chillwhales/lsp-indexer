import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    DataChanged: event("0xece574603820d07bc9b91f2a932baadf4628aabcb8afba49776529c14a6104b2", "DataChanged(bytes32,bytes)", {"dataKey": indexed(p.bytes32), "dataValue": p.bytes}),
    DelegateChanged: event("0x3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f", "DelegateChanged(address,address,address)", {"delegator": indexed(p.address), "fromDelegate": indexed(p.address), "toDelegate": indexed(p.address)}),
    DelegateVotesChanged: event("0xdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a724", "DelegateVotesChanged(address,uint256,uint256)", {"delegate": indexed(p.address), "previousBalance": p.uint256, "newBalance": p.uint256}),
    EIP712DomainChanged: event("0x0a6387c9ea3628b88a633bb4f3b151770f70085117a15f9bf3787cda53f13d31", "EIP712DomainChanged()", {}),
    OperatorAuthorizationChanged: event("0xf772a43bfdf4729b196e3fb54a818b91a2ca6c49d10b2e16278752f9f515c25d", "OperatorAuthorizationChanged(address,address,uint256,bytes)", {"operator": indexed(p.address), "tokenOwner": indexed(p.address), "amount": indexed(p.uint256), "operatorNotificationData": p.bytes}),
    OperatorRevoked: event("0x0ebf5762d8855cbe012d2ca42fb33a81175e17c8a8751f8859931ba453bd4167", "OperatorRevoked(address,address,bool,bytes)", {"operator": indexed(p.address), "tokenOwner": indexed(p.address), "notified": indexed(p.bool), "operatorNotificationData": p.bytes}),
    OwnershipTransferred: event("0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", "OwnershipTransferred(address,address)", {"previousOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    Transfer: event("0x3997e418d2cef0b3b0e907b1e39605c3f7d32dbd061e82ea5b4a770d46a160a6", "Transfer(address,address,address,uint256,bool,bytes)", {"operator": indexed(p.address), "from": indexed(p.address), "to": indexed(p.address), "amount": p.uint256, "force": p.bool, "data": p.bytes}),
}

export const functions = {
    CLOCK_MODE: viewFun("0x4bf5d7e9", "CLOCK_MODE()", {}, p.string),
    DOMAIN_SEPARATOR: viewFun("0x3644e515", "DOMAIN_SEPARATOR()", {}, p.bytes32),
    authorizeOperator: fun("0xb49506fd", "authorizeOperator(address,uint256,bytes)", {"operator": p.address, "amount": p.uint256, "operatorNotificationData": p.bytes}, ),
    authorizedAmountFor: viewFun("0x65aeaa95", "authorizedAmountFor(address,address)", {"operator": p.address, "tokenOwner": p.address}, p.uint256),
    balanceOf: viewFun("0x70a08231", "balanceOf(address)", {"tokenOwner": p.address}, p.uint256),
    batchCalls: fun("0x6963d438", "batchCalls(bytes[])", {"data": p.array(p.bytes)}, p.array(p.bytes)),
    checkpoints: viewFun("0xf1127ed8", "checkpoints(address,uint32)", {"account": p.address, "pos": p.uint32}, p.struct({"fromBlock": p.uint32, "votes": p.uint224})),
    clock: viewFun("0x91ddadf4", "clock()", {}, p.uint48),
    decimals: viewFun("0x313ce567", "decimals()", {}, p.uint8),
    decreaseAllowance: fun("0x78381670", "decreaseAllowance(address,address,uint256,bytes)", {"operator": p.address, "tokenOwner": p.address, "subtractedAmount": p.uint256, "operatorNotificationData": p.bytes}, ),
    delegate: fun("0x5c19a95c", "delegate(address)", {"delegatee": p.address}, ),
    delegateBySig: fun("0xc3cda520", "delegateBySig(address,uint256,uint256,uint8,bytes32,bytes32)", {"delegatee": p.address, "nonce": p.uint256, "expiry": p.uint256, "v": p.uint8, "r": p.bytes32, "s": p.bytes32}, ),
    delegates: viewFun("0x587cde1e", "delegates(address)", {"account": p.address}, p.address),
    eip712Domain: viewFun("0x84b0196e", "eip712Domain()", {}, {"fields": p.bytes1, "name": p.string, "version": p.string, "chainId": p.uint256, "verifyingContract": p.address, "salt": p.bytes32, "extensions": p.array(p.uint256)}),
    getData: viewFun("0x54f6127f", "getData(bytes32)", {"dataKey": p.bytes32}, p.bytes),
    getDataBatch: viewFun("0xdedff9c6", "getDataBatch(bytes32[])", {"dataKeys": p.array(p.bytes32)}, p.array(p.bytes)),
    getOperatorsOf: viewFun("0xd72fc29a", "getOperatorsOf(address)", {"tokenOwner": p.address}, p.array(p.address)),
    getPastTotalSupply: viewFun("0x8e539e8c", "getPastTotalSupply(uint256)", {"timepoint": p.uint256}, p.uint256),
    getPastVotes: viewFun("0x3a46b1a8", "getPastVotes(address,uint256)", {"account": p.address, "timepoint": p.uint256}, p.uint256),
    getVotes: viewFun("0x9ab24eb0", "getVotes(address)", {"account": p.address}, p.uint256),
    increaseAllowance: fun("0x2bc1da82", "increaseAllowance(address,uint256,bytes)", {"operator": p.address, "addedAmount": p.uint256, "operatorNotificationData": p.bytes}, ),
    nonces: viewFun("0x7ecebe00", "nonces(address)", {"owner": p.address}, p.uint256),
    numCheckpoints: viewFun("0x6fcfff45", "numCheckpoints(address)", {"account": p.address}, p.uint32),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    renounceOwnership: fun("0x715018a6", "renounceOwnership()", {}, ),
    revokeOperator: fun("0x30d0dc37", "revokeOperator(address,address,bool,bytes)", {"operator": p.address, "tokenOwner": p.address, "notify": p.bool, "operatorNotificationData": p.bytes}, ),
    setData: fun("0x7f23690c", "setData(bytes32,bytes)", {"dataKey": p.bytes32, "dataValue": p.bytes}, ),
    setDataBatch: fun("0x97902421", "setDataBatch(bytes32[],bytes[])", {"dataKeys": p.array(p.bytes32), "dataValues": p.array(p.bytes)}, ),
    supportsInterface: viewFun("0x01ffc9a7", "supportsInterface(bytes4)", {"interfaceId": p.bytes4}, p.bool),
    totalSupply: viewFun("0x18160ddd", "totalSupply()", {}, p.uint256),
    transfer: fun("0x760d9bba", "transfer(address,address,uint256,bool,bytes)", {"from": p.address, "to": p.address, "amount": p.uint256, "force": p.bool, "data": p.bytes}, ),
    transferBatch: fun("0x2d7667c9", "transferBatch(address[],address[],uint256[],bool[],bytes[])", {"from": p.array(p.address), "to": p.array(p.address), "amount": p.array(p.uint256), "force": p.array(p.bool), "data": p.array(p.bytes)}, ),
    transferOwnership: fun("0xf2fde38b", "transferOwnership(address)", {"newOwner": p.address}, ),
}

export class Contract extends ContractBase {

    CLOCK_MODE() {
        return this.eth_call(functions.CLOCK_MODE, {})
    }

    DOMAIN_SEPARATOR() {
        return this.eth_call(functions.DOMAIN_SEPARATOR, {})
    }

    authorizedAmountFor(operator: AuthorizedAmountForParams["operator"], tokenOwner: AuthorizedAmountForParams["tokenOwner"]) {
        return this.eth_call(functions.authorizedAmountFor, {operator, tokenOwner})
    }

    balanceOf(tokenOwner: BalanceOfParams["tokenOwner"]) {
        return this.eth_call(functions.balanceOf, {tokenOwner})
    }

    checkpoints(account: CheckpointsParams["account"], pos: CheckpointsParams["pos"]) {
        return this.eth_call(functions.checkpoints, {account, pos})
    }

    clock() {
        return this.eth_call(functions.clock, {})
    }

    decimals() {
        return this.eth_call(functions.decimals, {})
    }

    delegates(account: DelegatesParams["account"]) {
        return this.eth_call(functions.delegates, {account})
    }

    eip712Domain() {
        return this.eth_call(functions.eip712Domain, {})
    }

    getData(dataKey: GetDataParams["dataKey"]) {
        return this.eth_call(functions.getData, {dataKey})
    }

    getDataBatch(dataKeys: GetDataBatchParams["dataKeys"]) {
        return this.eth_call(functions.getDataBatch, {dataKeys})
    }

    getOperatorsOf(tokenOwner: GetOperatorsOfParams["tokenOwner"]) {
        return this.eth_call(functions.getOperatorsOf, {tokenOwner})
    }

    getPastTotalSupply(timepoint: GetPastTotalSupplyParams["timepoint"]) {
        return this.eth_call(functions.getPastTotalSupply, {timepoint})
    }

    getPastVotes(account: GetPastVotesParams["account"], timepoint: GetPastVotesParams["timepoint"]) {
        return this.eth_call(functions.getPastVotes, {account, timepoint})
    }

    getVotes(account: GetVotesParams["account"]) {
        return this.eth_call(functions.getVotes, {account})
    }

    nonces(owner: NoncesParams["owner"]) {
        return this.eth_call(functions.nonces, {owner})
    }

    numCheckpoints(account: NumCheckpointsParams["account"]) {
        return this.eth_call(functions.numCheckpoints, {account})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }

    supportsInterface(interfaceId: SupportsInterfaceParams["interfaceId"]) {
        return this.eth_call(functions.supportsInterface, {interfaceId})
    }

    totalSupply() {
        return this.eth_call(functions.totalSupply, {})
    }
}

/// Event types
export type DataChangedEventArgs = EParams<typeof events.DataChanged>
export type DelegateChangedEventArgs = EParams<typeof events.DelegateChanged>
export type DelegateVotesChangedEventArgs = EParams<typeof events.DelegateVotesChanged>
export type EIP712DomainChangedEventArgs = EParams<typeof events.EIP712DomainChanged>
export type OperatorAuthorizationChangedEventArgs = EParams<typeof events.OperatorAuthorizationChanged>
export type OperatorRevokedEventArgs = EParams<typeof events.OperatorRevoked>
export type OwnershipTransferredEventArgs = EParams<typeof events.OwnershipTransferred>
export type TransferEventArgs = EParams<typeof events.Transfer>

/// Function types
export type CLOCK_MODEParams = FunctionArguments<typeof functions.CLOCK_MODE>
export type CLOCK_MODEReturn = FunctionReturn<typeof functions.CLOCK_MODE>

export type DOMAIN_SEPARATORParams = FunctionArguments<typeof functions.DOMAIN_SEPARATOR>
export type DOMAIN_SEPARATORReturn = FunctionReturn<typeof functions.DOMAIN_SEPARATOR>

export type AuthorizeOperatorParams = FunctionArguments<typeof functions.authorizeOperator>
export type AuthorizeOperatorReturn = FunctionReturn<typeof functions.authorizeOperator>

export type AuthorizedAmountForParams = FunctionArguments<typeof functions.authorizedAmountFor>
export type AuthorizedAmountForReturn = FunctionReturn<typeof functions.authorizedAmountFor>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type BatchCallsParams = FunctionArguments<typeof functions.batchCalls>
export type BatchCallsReturn = FunctionReturn<typeof functions.batchCalls>

export type CheckpointsParams = FunctionArguments<typeof functions.checkpoints>
export type CheckpointsReturn = FunctionReturn<typeof functions.checkpoints>

export type ClockParams = FunctionArguments<typeof functions.clock>
export type ClockReturn = FunctionReturn<typeof functions.clock>

export type DecimalsParams = FunctionArguments<typeof functions.decimals>
export type DecimalsReturn = FunctionReturn<typeof functions.decimals>

export type DecreaseAllowanceParams = FunctionArguments<typeof functions.decreaseAllowance>
export type DecreaseAllowanceReturn = FunctionReturn<typeof functions.decreaseAllowance>

export type DelegateParams = FunctionArguments<typeof functions.delegate>
export type DelegateReturn = FunctionReturn<typeof functions.delegate>

export type DelegateBySigParams = FunctionArguments<typeof functions.delegateBySig>
export type DelegateBySigReturn = FunctionReturn<typeof functions.delegateBySig>

export type DelegatesParams = FunctionArguments<typeof functions.delegates>
export type DelegatesReturn = FunctionReturn<typeof functions.delegates>

export type Eip712DomainParams = FunctionArguments<typeof functions.eip712Domain>
export type Eip712DomainReturn = FunctionReturn<typeof functions.eip712Domain>

export type GetDataParams = FunctionArguments<typeof functions.getData>
export type GetDataReturn = FunctionReturn<typeof functions.getData>

export type GetDataBatchParams = FunctionArguments<typeof functions.getDataBatch>
export type GetDataBatchReturn = FunctionReturn<typeof functions.getDataBatch>

export type GetOperatorsOfParams = FunctionArguments<typeof functions.getOperatorsOf>
export type GetOperatorsOfReturn = FunctionReturn<typeof functions.getOperatorsOf>

export type GetPastTotalSupplyParams = FunctionArguments<typeof functions.getPastTotalSupply>
export type GetPastTotalSupplyReturn = FunctionReturn<typeof functions.getPastTotalSupply>

export type GetPastVotesParams = FunctionArguments<typeof functions.getPastVotes>
export type GetPastVotesReturn = FunctionReturn<typeof functions.getPastVotes>

export type GetVotesParams = FunctionArguments<typeof functions.getVotes>
export type GetVotesReturn = FunctionReturn<typeof functions.getVotes>

export type IncreaseAllowanceParams = FunctionArguments<typeof functions.increaseAllowance>
export type IncreaseAllowanceReturn = FunctionReturn<typeof functions.increaseAllowance>

export type NoncesParams = FunctionArguments<typeof functions.nonces>
export type NoncesReturn = FunctionReturn<typeof functions.nonces>

export type NumCheckpointsParams = FunctionArguments<typeof functions.numCheckpoints>
export type NumCheckpointsReturn = FunctionReturn<typeof functions.numCheckpoints>

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

export type SupportsInterfaceParams = FunctionArguments<typeof functions.supportsInterface>
export type SupportsInterfaceReturn = FunctionReturn<typeof functions.supportsInterface>

export type TotalSupplyParams = FunctionArguments<typeof functions.totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof functions.totalSupply>

export type TransferParams = FunctionArguments<typeof functions.transfer>
export type TransferReturn = FunctionReturn<typeof functions.transfer>

export type TransferBatchParams = FunctionArguments<typeof functions.transferBatch>
export type TransferBatchReturn = FunctionReturn<typeof functions.transferBatch>

export type TransferOwnershipParams = FunctionArguments<typeof functions.transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof functions.transferOwnership>

