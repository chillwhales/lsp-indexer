import assert from "assert"
import * as marshal from "./marshal"

export class PrimaryContractDeployment {
    private _salt!: string
    private _fundingAmount!: bigint
    private _creationBytecode!: string

    constructor(props?: Partial<Omit<PrimaryContractDeployment, 'toJSON'>>, json?: any) {
        Object.assign(this, props)
        if (json != null) {
            this._salt = marshal.string.fromJSON(json.salt)
            this._fundingAmount = marshal.bigint.fromJSON(json.fundingAmount)
            this._creationBytecode = marshal.string.fromJSON(json.creationBytecode)
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

    get creationBytecode(): string {
        assert(this._creationBytecode != null, 'uninitialized access')
        return this._creationBytecode
    }

    set creationBytecode(value: string) {
        this._creationBytecode = value
    }

    toJSON(): object {
        return {
            salt: this.salt,
            fundingAmount: marshal.bigint.toJSON(this.fundingAmount),
            creationBytecode: this.creationBytecode,
        }
    }
}
