import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    DeployedContracts: event("0x0e20ea3d6273aab49a7dabafc15cc94971c12dd63a07185ca810e497e4e87aa6", "DeployedContracts(address,address,(bytes32,uint256,bytes),(uint256,bytes,bool,bytes),address,bytes)", {"primaryContract": indexed(p.address), "secondaryContract": indexed(p.address), "primaryContractDeployment": p.struct({"salt": p.bytes32, "fundingAmount": p.uint256, "creationBytecode": p.bytes}), "secondaryContractDeployment": p.struct({"fundingAmount": p.uint256, "creationBytecode": p.bytes, "addPrimaryContractAddress": p.bool, "extraConstructorParams": p.bytes}), "postDeploymentModule": p.address, "postDeploymentModuleCalldata": p.bytes}),
    DeployedERC1167Proxies: event("0xe20570ed9bda3b93eea277b4e5d975c8933fd5f85f2c824d0845ae96c55a54fe", "DeployedERC1167Proxies(address,address,(bytes32,uint256,address,bytes),(uint256,address,bytes,bool,bytes),address,bytes)", {"primaryContract": indexed(p.address), "secondaryContract": indexed(p.address), "primaryContractDeploymentInit": p.struct({"salt": p.bytes32, "fundingAmount": p.uint256, "implementationContract": p.address, "initializationCalldata": p.bytes}), "secondaryContractDeploymentInit": p.struct({"fundingAmount": p.uint256, "implementationContract": p.address, "initializationCalldata": p.bytes, "addPrimaryContractAddress": p.bool, "extraInitializationParams": p.bytes}), "postDeploymentModule": p.address, "postDeploymentModuleCalldata": p.bytes}),
}

export const functions = {
    computeAddresses: viewFun("0xdd5940f3", "computeAddresses((bytes32,uint256,bytes),(uint256,bytes,bool,bytes),address,bytes)", {"primaryContractDeployment": p.struct({"salt": p.bytes32, "fundingAmount": p.uint256, "creationBytecode": p.bytes}), "secondaryContractDeployment": p.struct({"fundingAmount": p.uint256, "creationBytecode": p.bytes, "addPrimaryContractAddress": p.bool, "extraConstructorParams": p.bytes}), "postDeploymentModule": p.address, "postDeploymentModuleCalldata": p.bytes}, {"primaryContractAddress": p.address, "secondaryContractAddress": p.address}),
    computeERC1167Addresses: viewFun("0x72b19d36", "computeERC1167Addresses((bytes32,uint256,address,bytes),(uint256,address,bytes,bool,bytes),address,bytes)", {"primaryContractDeploymentInit": p.struct({"salt": p.bytes32, "fundingAmount": p.uint256, "implementationContract": p.address, "initializationCalldata": p.bytes}), "secondaryContractDeploymentInit": p.struct({"fundingAmount": p.uint256, "implementationContract": p.address, "initializationCalldata": p.bytes, "addPrimaryContractAddress": p.bool, "extraInitializationParams": p.bytes}), "postDeploymentModule": p.address, "postDeploymentModuleCalldata": p.bytes}, {"primaryContractAddress": p.address, "secondaryContractAddress": p.address}),
    deployContracts: fun("0x754b86b5", "deployContracts((bytes32,uint256,bytes),(uint256,bytes,bool,bytes),address,bytes)", {"primaryContractDeployment": p.struct({"salt": p.bytes32, "fundingAmount": p.uint256, "creationBytecode": p.bytes}), "secondaryContractDeployment": p.struct({"fundingAmount": p.uint256, "creationBytecode": p.bytes, "addPrimaryContractAddress": p.bool, "extraConstructorParams": p.bytes}), "postDeploymentModule": p.address, "postDeploymentModuleCalldata": p.bytes}, {"primaryContractAddress": p.address, "secondaryContractAddress": p.address}),
    deployERC1167Proxies: fun("0x6a66a753", "deployERC1167Proxies((bytes32,uint256,address,bytes),(uint256,address,bytes,bool,bytes),address,bytes)", {"primaryContractDeploymentInit": p.struct({"salt": p.bytes32, "fundingAmount": p.uint256, "implementationContract": p.address, "initializationCalldata": p.bytes}), "secondaryContractDeploymentInit": p.struct({"fundingAmount": p.uint256, "implementationContract": p.address, "initializationCalldata": p.bytes, "addPrimaryContractAddress": p.bool, "extraInitializationParams": p.bytes}), "postDeploymentModule": p.address, "postDeploymentModuleCalldata": p.bytes}, {"primaryContractAddress": p.address, "secondaryContractAddress": p.address}),
}

export class Contract extends ContractBase {

    computeAddresses(primaryContractDeployment: ComputeAddressesParams["primaryContractDeployment"], secondaryContractDeployment: ComputeAddressesParams["secondaryContractDeployment"], postDeploymentModule: ComputeAddressesParams["postDeploymentModule"], postDeploymentModuleCalldata: ComputeAddressesParams["postDeploymentModuleCalldata"]) {
        return this.eth_call(functions.computeAddresses, {primaryContractDeployment, secondaryContractDeployment, postDeploymentModule, postDeploymentModuleCalldata})
    }

    computeERC1167Addresses(primaryContractDeploymentInit: ComputeERC1167AddressesParams["primaryContractDeploymentInit"], secondaryContractDeploymentInit: ComputeERC1167AddressesParams["secondaryContractDeploymentInit"], postDeploymentModule: ComputeERC1167AddressesParams["postDeploymentModule"], postDeploymentModuleCalldata: ComputeERC1167AddressesParams["postDeploymentModuleCalldata"]) {
        return this.eth_call(functions.computeERC1167Addresses, {primaryContractDeploymentInit, secondaryContractDeploymentInit, postDeploymentModule, postDeploymentModuleCalldata})
    }
}

/// Event types
export type DeployedContractsEventArgs = EParams<typeof events.DeployedContracts>
export type DeployedERC1167ProxiesEventArgs = EParams<typeof events.DeployedERC1167Proxies>

/// Function types
export type ComputeAddressesParams = FunctionArguments<typeof functions.computeAddresses>
export type ComputeAddressesReturn = FunctionReturn<typeof functions.computeAddresses>

export type ComputeERC1167AddressesParams = FunctionArguments<typeof functions.computeERC1167Addresses>
export type ComputeERC1167AddressesReturn = FunctionReturn<typeof functions.computeERC1167Addresses>

export type DeployContractsParams = FunctionArguments<typeof functions.deployContracts>
export type DeployContractsReturn = FunctionReturn<typeof functions.deployContracts>

export type DeployERC1167ProxiesParams = FunctionArguments<typeof functions.deployERC1167Proxies>
export type DeployERC1167ProxiesReturn = FunctionReturn<typeof functions.deployERC1167Proxies>

