import assert from "assert"
import * as marshal from "./marshal"

export class PrimaryContractDeploymentInit {
    private _salt!: string
    private _fundingAmount!: bigint
    private _implementationContract!: string
    private _initializationCalldata!: string

    constructor(props?: Partial<Omit<PrimaryContractDeploymentInit, 'toJSON'>>, json?: any) {
        Object.assign(this, props)
        if (json != null) {
            this._salt = marshal.string.fromJSON(json.salt)
            this._fundingAmount = marshal.bigint.fromJSON(json.fundingAmount)
            this._implementationContract = marshal.string.fromJSON(json.implementationContract)
            this._initializationCalldata = marshal.string.fromJSON(json.initializationCalldata)
        }
    }

    get salt(): string {
        assert(this._salt != null, 'uninitialized access')
        return this._salt
    }

    set salt(value: string) {
        this._salt = value
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

    toJSON(): object {
        return {
            salt: this.salt,
            fundingAmount: marshal.bigint.toJSON(this.fundingAmount),
            implementationContract: this.implementationContract,
            initializationCalldata: this.initializationCalldata,
        }
    }
}
