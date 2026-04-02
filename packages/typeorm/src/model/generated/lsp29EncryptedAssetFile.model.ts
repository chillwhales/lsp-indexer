import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"
import {LSP29EncryptedAsset} from "./lsp29EncryptedAsset.model"

@Index_(["blockNumber", "transactionIndex", "logIndex"], {unique: false})
@Entity_()
export class LSP29EncryptedAssetFile {
    constructor(props?: Partial<LSP29EncryptedAssetFile>) {
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

    @Index_({unique: true})
    @OneToOne_(() => LSP29EncryptedAsset, {nullable: true})
    @JoinColumn_()
    lsp29EncryptedAsset!: LSP29EncryptedAsset

    @Index_()
    @StringColumn_({nullable: true})
    type!: string | undefined | null

    @Index_()
    @StringColumn_({nullable: true})
    name!: string | undefined | null

    @BigIntColumn_({nullable: true})
    size!: bigint | undefined | null

    @BigIntColumn_({nullable: true})
    lastModified!: bigint | undefined | null

    @Index_()
    @StringColumn_({nullable: true})
    hash!: string | undefined | null
}
