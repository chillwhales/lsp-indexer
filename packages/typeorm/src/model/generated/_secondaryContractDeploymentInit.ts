import assert from "assert"
import * as marshal from "./marshal"

export class SecondaryContractDeploymentInit {
    private _fundingAmount!: bigint
    private _implementationContract!: string
    private _initializationCalldata!: string
    private _addPrimaryContractAddress!: boolean
    private _extraInitializationParams!: string

    constructor(props?: Partial<Omit<SecondaryContractDeploymentInit, 'toJSON'>>, json?: any) {
        Object.assign(this, props)
        if (json != null) {
            this._fundingAmount = marshal.bigint.fromJSON(json.fundingAmount)
            this._implementationContract = marshal.string.fromJSON(json.implementationContract)
            this._initializationCalldata = marshal.string.fromJSON(json.initializationCalldata)
            this._addPrimaryContractAddress = marshal.boolean.fromJSON(json.addPrimaryContractAddress)
            this._extraInitializationParams = marshal.string.fromJSON(json.extraInitializationParams)
        }
    }

    get fundingAmount(): bigint {
        assert(this._fundingAmount != null, 'uninitialized access')
        return this._fundingAmount
    }

    set fundingAmount(value: bigint) {
        this._fundingAmount = value
    }

    get implementationContract(): string {
        assert(this._implementationContract != null, 'uninitialized access')
        return this._implementationContract
    }

    set implementationContract(value: string) {
        this._implementationContract = value
    }

    get initializationCalldata(): string {
        assert(this._initializationCalldata != null, 'uninitialized access')
        return this._initializationCalldata
    }

    set initializationCalldata(value: string) {
        this._initializationCalldata = value
    }

    get addPrimaryContractAddress(): boolean {
        assert(this._addPrimaryContractAddress != null, 'uninitialized access')
        return this._addPrimaryContractAddress
    }

    set addPrimaryContractAddress(value: boolean) {
        this._addPrimaryContractAddress = value
    }

    get extraInitializationParams(): string {
        assert(this._extraInitializationParams != null, 'uninitialized access')
        return this._extraInitializationParams
    }

    set extraInitializationParams(value: string) {
        this._extraInitializationParams = value
    }

    toJSON(): object {
        return {
            fundingAmount: marshal.bigint.toJSON(this.fundingAmount),
            implementationContract: this.implementationContract,
            initializationCalldata: this.initializationCalldata,
            addPrimaryContractAddress: this.addPrimaryContractAddress,
            extraInitializationParams: this.extraInitializationParams,
        }
    }
}
