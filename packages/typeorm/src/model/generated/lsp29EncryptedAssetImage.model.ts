import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {LSP29EncryptedAsset} from "./lsp29EncryptedAsset.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP29EncryptedAssetImage {
    constructor(props?: Partial<LSP29EncryptedAssetImage>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    network!: string

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

    @Index_()
    @ManyToOne_(() => LSP29EncryptedAsset, {nullable: true})
    lsp29EncryptedAsset!: LSP29EncryptedAsset

    @StringColumn_({nullable: true})
    url!: string | undefined | null

    @Index_()
    @IntColumn_({nullable: true})
    width!: number | undefined | null

    @Index_()
    @IntColumn_({nullable: true})
    height!: number | undefined | null

    @StringColumn_({nullable: true})
    verificationMethod!: string | undefined | null

    @StringColumn_({nullable: true})
    verificationData!: string | undefined | null

    @StringColumn_({nullable: true})
    verificationSource!: string | undefined | null

    @Index_()
    @IntColumn_({nullable: false})
    imageIndex!: number
}
