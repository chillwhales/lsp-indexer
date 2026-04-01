import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, StringColumn as StringColumn_} from "@subsquid/typeorm-store"
import {LSP29EncryptedAsset} from "./lsp29EncryptedAsset.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP29EncryptedAssetDescription {
    constructor(props?: Partial<LSP29EncryptedAssetDescription>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @IntColumn_({nullable: false})
    blockNumber!: number

    @Index_()
    @IntColumn_({nullable: false})
    transactionIndex!: number

    @Index_()
    @IntColumn_({nullable: false})
    logIndex!: number

    @Index_({unique: true})
    @OneToOne_(() => LSP29EncryptedAsset, {nullable: true})
    @JoinColumn_()
    lsp29EncryptedAsset!: LSP29EncryptedAsset

    @StringColumn_({nullable: true})
    value!: string | undefined | null
}
