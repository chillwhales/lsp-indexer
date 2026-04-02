import assert from "assert"
import * as marshal from "./marshal"

export class SecondaryContractDeployment {
    private _fundingAmount!: bigint
    private _creationBytecode!: string
    private _addPrimaryContractAddress!: boolean
    private _extraConstructorParams!: string

    constructor(props?: Partial<Omit<SecondaryContractDeployment, 'toJSON'>>, json?: any) {
        Object.assign(this, props)
        if (json != null) {
            this._fundingAmount = marshal.bigint.fromJSON(json.fundingAmount)
            this._creationBytecode = marshal.string.fromJSON(json.creationBytecode)
            this._addPrimaryContractAddress = marshal.boolean.fromJSON(json.addPrimaryContractAddress)
            this._extraConstructorParams = marshal.string.fromJSON(json.extraConstructorParams)
        }
    }

    get fundingAmount(): bigint {
        assert(this._fundingAmount != null, 'uninitialized access')
        return this._fundingAmount
    }

    set fundingAmount(value: bigint) {
        this._fundingAmount = value
    }

    get creationBytecode(): string {
        assert(this._creationBytecode != null, 'uninitialized access')
        return this._creationBytecode
    }

    set creationBytecode(value: string) {
        this._creationBytecode = value
    }

    get addPrimaryContractAddress(): boolean {
        assert(this._addPrimaryContractAddress != null, 'uninitialized access')
        return this._addPrimaryContractAddress
    }

    set addPrimaryContractAddress(value: boolean) {
        this._addPrimaryContractAddress = value
    }

    get extraConstructorParams(): string {
        assert(this._extraConstructorParams != null, 'uninitialized access')
        return this._extraConstructorParams
    }

    set extraConstructorParams(value: string) {
        this._extraConstructorParams = value
    }

    toJSON(): object {
        return {
            fundingAmount: marshal.bigint.toJSON(this.fundingAmount),
            creationBytecode: this.creationBytecode,
            addPrimaryContractAddress: this.addPrimaryContractAddress,
            extraConstructorParams: this.extraConstructorParams,
        }
    }
}
