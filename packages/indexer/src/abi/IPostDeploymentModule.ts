import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const functions = {
    executePostDeployment: fun("0x28c4d14e", "executePostDeployment(address,address,bytes)", {"primaryContract": p.address, "secondaryContract": p.address, "calldataToPostDeploymentModule": p.bytes}, ),
}

export class Contract extends ContractBase {
}

/// Function types
export type ExecutePostDeploymentParams = FunctionArguments<typeof functions.executePostDeployment>
export type ExecutePostDeploymentReturn = FunctionReturn<typeof functions.executePostDeployment>

